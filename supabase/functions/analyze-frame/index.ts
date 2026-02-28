// =============================================================================
// LAWNLENS: analyze-frame Edge Function
// =============================================================================
// File: supabase/functions/analyze-frame/index.ts
//
// PURPOSE:
//   This function represents "Step 1" of the LawnLens AI pipeline. The mobile
//   app captures a photo of the user's yard and sends it (base64-encoded) to
//   this Edge Function. This function securely forwards it to the Dedalus Vision
//   API (multimodal image understanding) and returns a structured JSON profile
//   of the detected environment.
//
//   The JSON output becomes the `profile` object fed directly into the
//   `get-recommendations` Edge Function to power the RAG plant suggestions.
//
// INPUT (JSON body from client):
//   {
//     "image": "<base64-encoded JPEG string>"
//   }
//
// OUTPUT (JSON object):
//   {
//     "detected_existing_plants": ["string"],    // Plants already present in yard
//     "detected_yard_features": ["string"],      // e.g. "concrete path", "slope", "fence"
//     "estimated_microclimate": "string",        // e.g. "Hot, south-facing, dry"
//     "visible_soil_clues": "string",            // e.g. "Sandy, pale-colored soil visible"
//     "estimated_sun_exposure": "full_sun | partial_sun | partial_shade | full_shade"
//   }
//
// ENVIRONMENT VARIABLES (set via `supabase secrets set`):
//   - DEDALUS_API_KEY: Your Dedalus API key.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const DEDALUS_BASE_URL = "https://api.dedaluslabs.ai/v1"; // Note: dedaluslabs, NOT daedaluslabs

// Standard CORS headers required for cross-origin requests from the mobile app.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// The structured JSON schema we instruct the LLM to return.
// Being explicit about the schema dramatically reduces malformed-JSON errors.
const RESPONSE_SCHEMA = JSON.stringify({
  detected_existing_plants: ["string (common name)"],
  detected_yard_features: ["string (e.g. concrete path, slope, fence, irrigation system)"],
  estimated_microclimate: "string (e.g. Hot and dry south-facing, or Cool and damp north-facing)",
  visible_soil_clues: "string (e.g. Sandy, clay-like, dark loamy, rocky, or Not visible)",
  estimated_sun_exposure: "full_sun | partial_sun | partial_shade | full_shade",
});

// ---------------------------------------------------------------------------
// MAIN EDGE FUNCTION HANDLER
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
  // Handle CORS preflight request (browsers send this before every POST).
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // -----------------------------------------------------------------------
    // STEP 1: Read API key from Supabase Secrets
    // -----------------------------------------------------------------------
    // The Dedalus API key is stored server-side in Supabase Secrets.
    // It is NEVER sent to or from the client. This prevents the key from
    // being exposed in the mobile app's network traffic.
    const dedalusApiKey = Deno.env.get("DEDALUS_API_KEY");
    if (!dedalusApiKey) {
      throw new Error("DEDALUS_API_KEY is not set. Run: supabase secrets set DEDALUS_API_KEY=...");
    }

    // -----------------------------------------------------------------------
    // STEP 2: Parse the incoming request and validate the image
    // -----------------------------------------------------------------------
    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return new Response(
        JSON.stringify({ error: "Request body must include `image` (a base64-encoded JPEG string)." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Basic size check — a very small base64 string can't be a real photo.
    if (image.length < 1000) {
      return new Response(
        JSON.stringify({ error: "Image data appears too small. Ensure you are sending a complete base64 JPEG." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------------------------------
    // STEP 3: Call the Dedalus Vision API (multimodal chat completion)
    // -----------------------------------------------------------------------
    // We use the chat completions endpoint with image_url content type.
    // The image is passed as a data URI (data:image/jpeg;base64,...).
    const visionPayload = {
      model: "gpt-5.2", // Dedalus flagship model supports vision inputs
      temperature: 0.1, // Deterministic output is important for JSON parsing
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert horticulturalist and landscape architect.
Analyze this photo of a residential yard or garden space.

Return ONLY a single valid JSON object following this EXACT schema. Do NOT include any other text, markdown, or code blocks:
${RESPONSE_SCHEMA}

Be specific and precise. If something is not clearly visible, use "Not clearly visible" rather than guessing.
For estimated_sun_exposure, analyze shadows, plant health & color, and wall/surface orientation.`,
            },
            {
              type: "image_url",
              image_url: {
                // Standard data URI format for embedding a base64 JPEG image inline.
                url: `data:image/jpeg;base64,${image}`,
                // "low" detail is faster and cheaper; "high" provides more accuracy
                // for complex scenes but uses more tokens. Use "auto" in production.
                detail: "auto",
              },
            },
          ],
        },
      ],
    };

    const visionResponse = await fetch(`${DEDALUS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dedalusApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(visionPayload),
    });

    if (!visionResponse.ok) {
      const errBody = await visionResponse.text();
      throw new Error(`Dedalus Vision API error ${visionResponse.status}: ${errBody}`);
    }

    // -----------------------------------------------------------------------
    // STEP 4: Parse the Vision API response and return to the client
    // -----------------------------------------------------------------------
    const visionData = await visionResponse.json();
    const rawContent: string = visionData.choices[0].message.content;

    // Safely parse the JSON. The LLM should return raw JSON, but sometimes it
    // wraps it in ```json ... ``` markdown fences. The regex handles both cases.
    let parsedProfile: Record<string, unknown>;
    try {
      parsedProfile = JSON.parse(rawContent);
    } catch {
      // Attempt to strip markdown fences and re-parse
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedProfile = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Could not extract valid JSON from Vision API response: ${rawContent}`);
      }
    }

    return new Response(
      JSON.stringify(parsedProfile),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("[analyze-frame] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
