import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
  }

  try {
    const { image } = await req.json()

    // Initialize the client inside or outside the handler
    const response = await client.chat.completions.create({
      model: "openai/gpt-5-mini",
      messages: [
        {
          role: "user",
          content: [
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