import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // Real USDA API is SOAP-based and complex; for irvinehacks, we provide high-fidelity defaults based on region
    const soilData = {
      soil_texture: "loamy",
      soil_drainage: "well",
      soil_ph_range: { min: 6.0, max: 7.0 },
      organic_matter_percent: 4.5
    }

    // 3. Hardiness Zone (Simulated)
    const hardinessZone = "9b" // Orange County, CA default for IrvineHacks

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
