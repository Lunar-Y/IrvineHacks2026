import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Dedalus } from "npm:dedalus-labs"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    })
  }

  try {
    const { profile, preferences } = await req.json()
    const apiKey = Deno.env.get("DAEDALUS_API_KEY")

    if (!apiKey || apiKey === "your_key_here") {
      // Return dummy recommendations in simulation mode
      return new Response(JSON.stringify([
        { common_name: "Lavender", scientific_name: "Lavandula", why_it_fits: "Drought tolerant and loves full sun.", model_archetype: "flowering_shrub", water_usage_liters_per_week: 2 },
        { common_name: "Boxwood", scientific_name: "Buxus", why_it_fits: "Low maintenance evergreen.", model_archetype: "evergreen_shrub", water_usage_liters_per_week: 5 }
      ]), {
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
      });
    }

    const dedalus = new Dedalus({
      apiKey: apiKey
    });

    if (!dedalus.chat) {
      console.log("Dedalus structure:", Object.keys(dedalus));
      throw new Error("SDK Initialization Error: .chat is undefined");
    }

    const prompt = `You are an expert horticulturalist. Recommend 6 plants for this environment:
    Location: ${JSON.stringify(profile.coordinates)}
    Zone: ${profile.hardiness_zone}
    Soil: ${profile.soil.soil_texture}
    Purpose: ${preferences.purpose}

    Return ONLY a JSON array of objects with: common_name, scientific_name, why_it_fits, model_archetype (groundcover | flowering_shrub | small_tree | perennial_flower), water_usage_liters_per_week.`

    const stream = await dedalus.chat.completions.create({
      model: "google/gemini-2.5-flash",
      stream: true,
      messages: [{ role: "user", content: prompt }]
    })

    let fullContent = "";
    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullContent += content;
      }
    } catch (streamError: any) {
      console.error("Streaming Error:", streamError.message);
      throw new Error(`AI Streaming failed: ${streamError.message}`);
    }

    console.log("Raw Recommendations Response:", fullContent);

    if (!fullContent.trim()) {
      throw new Error("AI returned an empty response");
    }

    let recommendations;
    try {
      const sanitized = fullContent.replace(/```json|```/g, "").trim();
      recommendations = JSON.parse(sanitized);
    } catch (parseError: any) {
      console.error("JSON Parse Error:", parseError.message);
      console.error("Attempted to parse:", fullContent);
      throw new Error(`AI returned invalid JSON: ${parseError.message}`);
    }

    return new Response(JSON.stringify(recommendations), {
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error: any) {
    console.error("Recommendations Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
    })
  }
})
