import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
<<<<<<< HEAD
import { Dedalus } from "npm:dedalus-labs"

serve(async (req) => {
  // ... (CORS logic remains the same)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    })
=======
// Deno uses the npm: prefix to fetch packages from npm without a node_modules folder
import Dedalus from "npm:dedalus-labs"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// The SDK handles the URL automatically.
const client = new Dedalus({
  apiKey: Deno.env.get("DAEDALUS_API_KEY"),
});

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
>>>>>>> 38c2f479ec8365f833df74418afbce17d9f810b9
  }

  try {
    const { image } = await req.json()
<<<<<<< HEAD
    const apiKey = Deno.env.get("DAEDALUS_API_KEY")

    if (!apiKey || apiKey === "your_key_here") {
      // ... (simulation logic)
      return new Response(JSON.stringify({
        detected_existing_plants: ["Bermuda Grass", "Dandelion"],
        detected_yard_features: ["South-facing wall", "Concrete edge"],
        soil_analysis: { type: "loamy", condition: "dry", coverage_percent: 85 },
        estimated_microclimate: "Suburban garden with high afternoon sun",
        estimated_sun_exposure: "full_sun",
        confidence: 0.92,
        is_simulated: true
      }), {
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
      });
    }

    const dedalus = new Dedalus({
      apiKey: apiKey
    });

    // Debugging: Ensure dedalus is initialized correctly
    if (!dedalus.chat) {
      console.log("Dedalus structure:", Object.keys(dedalus));
      throw new Error("SDK Initialization Error: .chat is undefined");
    }

    const systemPrompt = `Analyze this yard image. Return ONLY valid JSON: { "detected_existing_plants": [], "detected_yard_features": [], "soil_analysis": { "type": "clay|sandy|loamy", "condition": "dry|moist", "coverage_percent": number }, "confidence": number }`;

    const stream = await dedalus.chat.completions.create({
      model: "google/gemini-2.5-flash",
      stream: true,
=======

    // Initialize the client inside or outside the handler
    const response = await client.chat.completions.create({
      model: "openai/gpt-5-mini",
>>>>>>> 38c2f479ec8365f833df74418afbce17d9f810b9
      messages: [
        {
          role: "user",
          content: [
<<<<<<< HEAD
            { type: "text", text: systemPrompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
          ]
        }
      ]
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

    console.log("Raw AI Response:", fullContent);

    if (!fullContent.trim()) {
      throw new Error("AI returned an empty response");
    }

    let content;
    try {
      const sanitized = fullContent.replace(/```json|```/g, "").trim();
      content = JSON.parse(sanitized);
    } catch (parseError: any) {
      console.error("JSON Parse Error:", parseError.message);
      console.error("Attempted to parse:", fullContent);
      throw new Error(`AI returned invalid JSON: ${parseError.message}`);
    }

    return new Response(JSON.stringify(content), {
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error: any) {
    console.error("Critical Function Error:", error.message)
    return new Response(JSON.stringify({
      detected_existing_plants: ["Unknown"],
      soil_analysis: { type: "loamy", condition: "unknown", coverage_percent: 50 },
      confidence: 0.5,
      is_error_fallback: true,
      error_message: error.message
    }), { 
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } 
=======
            {type: "text", text: systemPrompt},
            {type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` }},
          ],
        },
      ],
    })

    return new Response(JSON.stringify(response.choices[0].message.content), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("SDK Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
>>>>>>> 38c2f479ec8365f833df74418afbce17d9f810b9
    })
  }
})

const systemPrompt = `You are an expert horticulturalist. Analyze this image of a yard. 
Return ONLY valid JSON in this exact structure:
{
  "detected_existing_plants": [],
  "detected_yard_features": [],
  "estimated_microclimate": "",
  "estimated_sun_exposure": "full_sun | partial_sun | partial_shade | full_shade"
}`