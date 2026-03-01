import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type EdgeErrorDetails = {
  error: string
  step: string
  details?: string
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function mapMinFToZone(minF: number): string {
  if (minF < -55) return "1a"
  if (minF < -50) return "1b"
  if (minF < -45) return "2a"
  if (minF < -40) return "2b"
  if (minF < -35) return "3a"
  if (minF < -30) return "3b"
  if (minF < -25) return "4a"
  if (minF < -20) return "4b"
  if (minF < -15) return "5a"
  if (minF < -10) return "5b"
  if (minF < -5) return "6a"
  if (minF < 0) return "6b"
  if (minF < 5) return "7a"
  if (minF < 10) return "7b"
  if (minF < 15) return "8a"
  if (minF < 20) return "8b"
  if (minF < 25) return "9a"
  if (minF < 30) return "9b"
  if (minF < 35) return "10a"
  if (minF < 40) return "10b"
  if (minF < 45) return "11a"
  return "11b"
}

async function getHardinessZone(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lng}&start_year=2000&end_year=2020&daily=temperature_2m_min&models=EC_Earth3P_HR`
  )

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`climate_api_${res.status}:${errBody}`)
  }

  const data = await res.json()
  const minTemps = data?.daily?.temperature_2m_min
  if (!Array.isArray(minTemps) || minTemps.length === 0) {
    throw new Error("climate_api_missing_temperature_2m_min")
  }

  const numericTemps = minTemps.filter((temp: unknown) => typeof temp === "number" && Number.isFinite(temp))
  if (numericTemps.length === 0) {
    throw new Error("climate_api_invalid_temperature_2m_min")
  }

  const absMin = Math.min(...numericTemps)
  const minF = (absMin * 9 / 5) + 32
  return mapMinFToZone(minF)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lat, lng } = await req.json()
    if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
      return jsonResponse(
        { error: "invalid_coordinates", step: "request_validation", details: "Request body must include numeric `lat` and `lng`." } satisfies EdgeErrorDetails,
        400
      )
    }

    // 1. Fetch Weather from Open-Meteo
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`)
    if (!weatherRes.ok) {
      const errBody = await weatherRes.text()
      return jsonResponse(
        { error: "weather_upstream_failed", step: "weather_fetch", details: `open_meteo_${weatherRes.status}:${errBody}` } satisfies EdgeErrorDetails,
        502
      )
    }
    const weather = await weatherRes.json()
    if (!weather?.daily) {
      return jsonResponse(
        { error: "weather_payload_invalid", step: "weather_parse", details: "Missing `daily` in weather response." } satisfies EdgeErrorDetails,
        502
      )
    }

    // 2. Fetch Soil from USDA (Simulated for Prototype)
    const soilData = {
      soil_texture: "loamy",
      soil_drainage: "well",
      soil_ph_range: { min: 6.0, max: 7.0 },
      organic_matter_percent: 4.5
    }

    // 3. Hardiness Zone from Open-Meteo Climate API
    let hardinessZone: string
    try {
      hardinessZone = await getHardinessZone(lat, lng)
    } catch (zoneError) {
      return jsonResponse(
        {
          error: "hardiness_zone_failed",
          step: "hardiness_zone_fetch",
          details: zoneError instanceof Error ? zoneError.message : "Unknown hardiness-zone failure",
        } satisfies EdgeErrorDetails,
        502
      )
    }

    const profile = {
      coordinates: { lat, lng },
      weather: weather.daily,
      soil: soilData,
      hardiness_zone: hardinessZone,
      timestamp: new Date().toISOString()
    }

    return jsonResponse(profile, 200)
  } catch (error) {
    return jsonResponse(
      {
        error: "assemble_profile_internal_error",
        step: "request_processing",
        details: error instanceof Error ? error.message : "Unknown internal error",
      } satisfies EdgeErrorDetails,
      500
    )
  }
})
