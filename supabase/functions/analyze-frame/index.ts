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
//   - DEDALUS_API_KEY: Your Dedalus API key (e.g. dsk-live-...).
//   Run: supabase secrets set DEDALUS_API_KEY=your_key
//   Edge Functions do NOT read .env; they only read Supabase Secrets.
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

// ~6MB base64 = ~4.5MB raw image. Larger payloads can time out or be rejected by the Vision API.
const MAX_IMAGE_BASE64_LENGTH = 6 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// The structured JSON schema we instruct the LLM to return.
// Being explicit about the schema dramatically reduces malformed-JSON errors.
const RESPONSE_SCHEMA = JSON.stringify({
  is_lawn: "boolean (true if this is a plantable yard/lawn)",
  confidence: "number (0.0 to 1.0)",
  soil_analysis: {
    type: "string (loamy | sandy | clay | rocky)",
    coverage_percent: "number (0 to 100)"
  },
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
      return jsonError(
        "Server configuration error: DEDALUS_API_KEY is not set. Run: supabase secrets set DEDALUS_API_KEY=your_key",
        500
      );
    }

    // -----------------------------------------------------------------------
    // STEP 2: Parse the incoming request and validate the image
    // -----------------------------------------------------------------------
    let body: { image?: unknown };
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid request body: expected JSON with an `image` field (base64 string).", 400);
    }
    const { image } = body;

    if (!image || typeof image !== "string") {
      return jsonError("Missing or invalid image: request body must include `image` as a base64-encoded JPEG string.", 400);
    }

    if (image.length < 1000) {
      return jsonError("Image data too small: ensure you are sending a complete base64 JPEG (not an empty or truncated string).", 400);
    }

    if (image.length > MAX_IMAGE_BASE64_LENGTH) {
      return jsonError(
        "Image too large: the photo exceeds the maximum size. Use a lower quality or resolution (recommended under ~4MB).",
        400
      );
    }

    // -----------------------------------------------------------------------
    // STEP 3: Call the Dedalus Vision API (multimodal chat completion)
    // -----------------------------------------------------------------------
    // We use the chat completions endpoint with image_url content type.
    // The image is passed as a data URI (data:image/jpeg;base64,...).
    const visionPayload = {
      model: "openai/gpt-5.2", // Dedalus requires provider prefix; see docs.dedaluslabs.ai/sdk/images
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
      const status = visionResponse.status;
      let apiMessage: string;
      try {
        const errJson = JSON.parse(errBody);
        apiMessage = errJson?.error?.message ?? errJson?.message ?? errJson?.error ?? errBody;
      } catch {
        apiMessage = errBody || `HTTP ${status}`;
      }
      const cause =
        status === 401
          ? "Invalid or missing Vision API key (401). Check DEDALUS_API_KEY in Supabase secrets."
          : status === 403
          ? "Access denied to Vision API (403). Key may be invalid or not allowed for this endpoint."
          : status === 404
          ? "Vision model or endpoint not found (404). Model name may be wrong or unavailable."
          : status === 413
          ? "Request payload too large (413). Image size exceeds Vision API limit."
          : status === 429
          ? "Vision API rate limit exceeded (429). Try again in a moment."
          : status >= 500
          ? "Vision service error (5xx). The provider may be temporarily unavailable."
          : `Vision API error (${status})`;
      return jsonError(`${cause} ${typeof apiMessage === "string" && apiMessage ? `— ${apiMessage.slice(0, 200)}` : ""}`.trim(), 502);
    }

    // -----------------------------------------------------------------------
    // STEP 4: Parse the Vision API response and return to the client
    // -----------------------------------------------------------------------
    const visionData = await visionResponse.json();
    const choices = visionData?.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      return jsonError(
        "Vision API returned no choices. The model may be unavailable or the request was rejected. Check Supabase logs for the raw response.",
        502
      );
    }
    const firstChoice = choices[0];
    const content = firstChoice?.message?.content;
    if (content == null || typeof content !== "string") {
      const finishReason = firstChoice?.finish_reason ?? "unknown";
      return jsonError(
        `Vision API returned empty or invalid content (finish_reason: ${finishReason}). Model may not support this request or output was blocked.`,
        502
      );
    }
    const rawContent: string = content;

    // Safely parse the JSON. The LLM should return raw JSON, but sometimes it
    // wraps it in ```json ... ``` markdown fences. The regex handles both cases.
    let parsedProfile: Record<string, unknown>;
    try {
      parsedProfile = JSON.parse(rawContent);
    } catch {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedProfile = JSON.parse(jsonMatch[0]);
        } catch {
          return jsonError(
            "Vision API returned invalid JSON. The model output could not be parsed. Try scanning again.",
            502
          );
        }
      } else {
        return jsonError(
          "Vision API response was not valid JSON. The model may have returned plain text or markdown. Try scanning again.",
          502
        );
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
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[analyze-frame] Unhandled error:", error);
    return jsonError(`Server error: ${message}`, 500);
  }
});
