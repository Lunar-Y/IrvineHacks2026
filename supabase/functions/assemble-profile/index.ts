import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getHardinessZone(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lng}&start_year=2000&end_year=2020&daily=temperature_2m_min&models=EC_Earth3P_HR`
  )
  const data = await res.json()

  const minTemps: number[] = data.daily.temperature_2m_min
  const absMin = Math.min(...minTemps)

  const minF = (absMin * 9/5) + 32
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
  if (minF < -5)  return "6a"
  if (minF < 0)   return "6b"
  if (minF < 5)   return "7a"
  if (minF < 10)  return "7b"
  if (minF < 15)  return "8a"
  if (minF < 20)  return "8b"
  if (minF < 25)  return "9a"
  if (minF < 30)  return "9b"
  if (minF < 35)  return "10a"
  if (minF < 40)  return "10b"
  if (minF < 45)  return "11a"
  return "11b"
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lat, lng } = await req.json()

    // 1. Fetch Weather from Open-Meteo
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`)
    const weather = await weatherRes.json()

    // 2. Fetch Soil from USDA (Simulated for Prototype)
    const soilData = {
      soil_texture: "loamy",
      soil_drainage: "well",
      soil_ph_range: { min: 6.0, max: 7.0 },
      organic_matter_percent: 4.5
    }

    // 3. Hardiness Zone from Open-Meteo Climate API
    const hardinessZone = await getHardinessZone(lat, lng)

    const profile = {
      coordinates: { lat, lng },
      weather: weather.daily,
      soil: soilData,
      hardiness_zone: hardinessZone,
      timestamp: new Date().toISOString()
    }

    return new Response(JSON.stringify(profile), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})