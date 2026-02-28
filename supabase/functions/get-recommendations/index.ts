import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { profile, vision, preferences } = await req.json()

  // 1. Location / Climate
  const locationClimate = `Coordinates: ${JSON.stringify(profile.coordinates)}, Hardiness Zone: ${profile.hardiness_zone}, Weather: ${JSON.stringify(profile.weather)}`

  // 2. Sun exposure (from vision or fallback)
  const sunExposure = vision?.estimated_sun_exposure ?? "unknown (assume partial_sun)"

  // 3. Space + layout (from vision)
  const spaceLayout = vision?.detected_yard_features?.length
    ? vision.detected_yard_features.join(", ")
    : "unknown (assume typical residential yard)"

  // 4. Soil type
  const soilType = profile.soil
    ? `Texture: ${profile.soil.soil_texture}, Drainage: ${profile.soil.soil_drainage}, pH: ${JSON.stringify(profile.soil.soil_ph_range)}`
    : "unknown"

  // 5. Maintenance tolerance (user preference)
  const maintenanceTolerance = preferences?.maintenance_tolerance ?? "medium"

  const prompt = `You are an expert horticulturalist. Recommend 6–8 plants based on these criteria:

1. LOCATION/CLIMATE: ${locationClimate}

2. SUN EXPOSURE: ${sunExposure}

3. SPACE + LAYOUT: ${spaceLayout}
   ${vision?.detected_existing_plants?.length ? `Existing plants to consider: ${vision.detected_existing_plants.join(", ")}` : ""}

4. SOIL TYPE: ${soilType}

5. MAINTENANCE TOLERANCE: ${maintenanceTolerance} (low = minimal care, medium = moderate watering/pruning, high = willing to invest time)

Purpose: ${preferences?.purpose ?? "general landscaping"}

For each plant you recommend, assign a quantitative fit_score from 0–100 based on how well it matches the criteria above. Return ONLY the top 5 plants with the highest scores.

Return ONLY a valid JSON array of exactly 5 objects, each with:
- fit_score (number 0–100)
- common_name
- scientific_name
- why_it_fits (clear explanation of why this plant fits this yard)
- model_archetype (groundcover | flowering_shrub | small_tree | perennial_flower)
- water_usage_liters_per_week

Sort by fit_score descending (highest first). Never recommend invasive or toxic plants.`

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
  let raw = data.choices?.[0]?.message?.content ?? "[]"
  // Strip markdown code blocks if present
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) raw = match[1]
  let recommendations = JSON.parse(raw.trim())
  if (!Array.isArray(recommendations)) recommendations = []

  // Sort by fit_score descending and take top 5 (fallback: first 5 if no scores)
  const withScores = recommendations.filter((r: { fit_score?: number }) => typeof r.fit_score === "number")
  const sorted = (withScores.length > 0 ? withScores : recommendations)
    .sort((a: { fit_score?: number }, b: { fit_score?: number }) => (b.fit_score ?? 0) - (a.fit_score ?? 0))
    .slice(0, 5)

  return new Response(JSON.stringify(sorted), {
    headers: { "Content-Type": "application/json" }
  })
})
