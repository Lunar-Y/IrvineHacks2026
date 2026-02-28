import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { profile, preferences } = await req.json()

  const prompt = `You are an expert horticulturalist. Recommend 6 plants for this environment:
  Location: ${JSON.stringify(profile.coordinates)}
  Zone: ${profile.hardiness_zone}
  Soil: ${profile.soil.soil_texture}
  Purpose: ${preferences.purpose}

  Return ONLY a JSON array of objects with: common_name, scientific_name, why_it_fits, model_archetype (groundcover | flowering_shrub | small_tree | perennial_flower), water_usage_liters_per_week.`

  const response = await fetch("https://api.daedaluslabs.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("DAEDALUS_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet",
      messages: [{ role: "user", content: prompt }]
    })
  })

  const data = await response.json()
  const recommendations = JSON.parse(data.choices[0].message.content)

  return new Response(JSON.stringify(recommendations), {
    headers: { "Content-Type": "application/json" }
  })
})
