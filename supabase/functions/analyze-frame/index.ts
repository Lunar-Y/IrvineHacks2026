import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DAEDALUS_API_URL = "https://api.daedaluslabs.ai/v1/chat/completions"

serve(async (req) => {
  const { image } = await req.json() // base64 image string

  const systemPrompt = `You are an expert horticulturalist. Analyze this image of a yard. 
  Return ONLY valid JSON in this exact structure:
  {
    "detected_existing_plants": [],
    "detected_yard_features": [],
    "estimated_microclimate": "",
    "estimated_sun_exposure": "full_sun | partial_sun | partial_shade | full_shade"
  }`;

  const payload = {
    model: "claude-3-5-sonnet",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: systemPrompt
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${image}`
            }
          }
        ]
      }
    ]
  }

  const response = await fetch(DAEDALUS_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("DAEDALUS_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  return new Response(JSON.stringify(data.choices[0].message.content), {
    headers: { "Content-Type": "application/json" }
  })
})
