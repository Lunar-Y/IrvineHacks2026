// =============================================================================
// LAWNLENS: get-recommendations Edge Function
// =============================================================================
// File: supabase/functions/get-recommendations/index.ts
//
// PURPOSE:
//   This is the CORE AI Brain of LawnLens. It implements the full RAG pipeline:
//     1. RETRIEVE: Query Supabase's rag_plants table using pgvector cosine
//        similarity search (via the `match_plants` RPC) to find the plants
//        that mathematically best match the user's yard environment.
//     2. AUGMENT:  Bundle those matched plants as structured context.
//     3. GENERATE: Pass the context to Dedalus LLM to generate human-readable,
//        personalized, and highly accurate landscaping recommendations.
//
// INPUT (JSON body from client):
//   {
//     "profile": {
//       "coordinates": { "lat": 33.68, "lng": -117.83 },
//       "hardiness_zone": 10,
//       "has_pets": false,
//       "soil": {
//         "soil_texture": "loamy",
//         "drainage": "well"
//       },
//       "estimated_sun_exposure": "full_sun",
//       "estimated_microclimate": "Hot and dry. South-facing wall."
//     },
//     "preferences": {
//       "purpose": "Low water ornamental groundcover for front yard",
//       "avoid_invasive": true
//     }
//   }
//
// OUTPUT (JSON array to client):
//   Array of 5 plant recommendations with reasoning and care data.
//
// ENVIRONMENT VARIABLES (Supabase Secrets, NOT hardcoded):
//   - DEDALUS_API_KEY: Your Dedalus API key. Set via `supabase secrets set`.
//   - SUPABASE_URL: Auto-provided by Supabase runtime.
//   - SUPABASE_ANON_KEY: Auto-provided by Supabase runtime.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

// The Dedalus Levels API base URL. Note: "dedaluslabs" NOT "daedaluslabs".
const DEDALUS_BASE_URL = "https://api.dedaluslabs.ai/v1";

// CORS headers required for all CORS preflight requests (HTTP OPTIONS method).
// Without these, the mobile app's HTTP client will block the response.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------------------------------------------------------------------------
// HELPER: Dedalus Text Embedding API
// ---------------------------------------------------------------------------
// Converts a plain-text description of a yard environment into a 1536-dimension
// float vector using the lightweight `text-embedding-ada-002` model.
// This vector represents the "semantic fingerprint" of the yard, which we then
// use to find the most mathematically similar plants in the `rag_plants` table.
async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(`${DEDALUS_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-ada-002",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Dedalus Embeddings API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  // The API returns: { data: [{ embedding: [float, float, ...] }] }
  return data.data[0].embedding;
}

// ---------------------------------------------------------------------------
// HELPER: Wikipedia Image API
// ---------------------------------------------------------------------------
// Fetches the primary thumbnail image for a plant using its scientific name.
async function getWikipediaImageUrl(scientificName: string): Promise<string | undefined> {
  try {
    const title = scientificName.trim().replace(/\s+/g, '_');
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (response.ok) {
      const data = await response.json();
      return data.thumbnail?.source || data.originalimage?.source;
    }
  } catch (err) {
    console.error(`Wikipedia image fetch failed for ${scientificName}:`, err);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// HELPER: Dedalus LLM Chat Completion (Generation Step)
// ---------------------------------------------------------------------------
// Takes the RAG context (the matched plants) and the user's profile/preferences,
// and generates a structured, helpful, human-friendly plant recommendation list.
async function getLLMRecommendations(
  profile: Record<string, unknown>,
  preferences: Record<string, unknown>,
  ragContext: string,
  apiKey: string
): Promise<unknown[]> {
  // The system prompt precisely tells the LLM its role, what data to use,
  // and what format to return. Being explicit prevents JSON formatting errors.
  const systemPrompt = `You are an expert landscape architect and horticulturalist for the LawnLens AI app.
You MUST recommend exactly 5 plants to the user based STRICTLY on the RAG DATABASE MATCHES provided below.
Do NOT recommend plants that are not in the RAG DATABASE MATCHES.
Rank them from most to least suitable for the user's specific yard.

RAG DATABASE MATCHES (Use ONLY these plants):
${ragContext}

USER YARD PROFILE:
- Hardiness Zone: ${profile.hardiness_zone}
- Estimated Sun Exposure: ${profile.estimated_sun_exposure ?? "unknown"}
- Microclimate Notes: ${profile.estimated_microclimate ?? "none"}
- Soil Texture: ${(profile.soil as Record<string, unknown>)?.soil_texture ?? "unknown"}
- Soil Drainage: ${(profile.soil as Record<string, unknown>)?.drainage ?? "unknown"}
- Has Pets: ${profile.has_pets ? "Yes (avoid toxic plants!)" : "No"}

USER PREFERENCES:
- Purpose: ${preferences.purpose}
- Avoid Invasive Species: ${preferences.avoid_invasive ? "Yes" : "No"}

Return ONLY a valid JSON array. No markdown, no commentary outside the JSON.
Each object in the array MUST follow this exact structure:
{
  "common_name": "string",
  "scientific_name": "string",
  "why_it_fits": "2-sentence explanation of why this plant is perfect for this specific yard",
  "mature_height_meters": number,
  "water_requirement": "low | medium | high",
  "is_toxic_to_pets": boolean,
  "care_tip": "One actionable care tip specific to this user's climate",
  
  // AR Classification: The LLM must classify the plant into one of the 4 available 
  // 3D model categories so the app knows which GLB file to render in the real world.
  "model_archetype": "tree | large_tree | shrub | flower (choose the best 3D model category for this plant)"
}`;

  const response = await fetch(`${DEDALUS_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.2", // Use the cost-effective and fast Dedalus flagship model
      messages: [
        { role: "user", content: systemPrompt },
      ],
      temperature: 0.2, // Low temperature = more factual, consistent output
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Dedalus Chat API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const rawContent: string = data.choices[0].message.content;

  // Safely parse the LLM's JSON output. Wrap in try/catch to handle
  // edge cases where the model adds extra text before/after the JSON array.
  try {
    return JSON.parse(rawContent);
  } catch {
    // As a fallback, try to extract the JSON array from the raw content
    const match = rawContent.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error(`Could not parse LLM response as JSON: ${rawContent}`);
  }
}

// ---------------------------------------------------------------------------
// MAIN EDGE FUNCTION HANDLER
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
  // All Edge Functions must handle the CORS preflight OPTIONS request.
  // This is automatically sent by browsers before every cross-origin POST request.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // -----------------------------------------------------------------------
    // STEP 0: Setup — Read secrets and initialize the Supabase client
    // -----------------------------------------------------------------------

    // Read the Dedalus API key from Supabase Secrets (NOT from the client request).
    // This key is set via: `supabase secrets set DEDALUS_API_KEY=dsk-live-...`
    const dedalusApiKey = Deno.env.get("DEDALUS_API_KEY");
    if (!dedalusApiKey) {
      throw new Error("DEDALUS_API_KEY is not set in Supabase Secrets.");
    }

    // The Supabase client uses the SERVICE ROLE key internally in Deno Edge Functions.
    // SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically injected
    // by the Supabase runtime. We do NOT need to read them from the client.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // Service role bypasses Row Level Security
    );

    // -----------------------------------------------------------------------
    // STEP 1: Parse + validate the incoming request body
    // -----------------------------------------------------------------------
    const { profile, preferences } = await req.json();

    if (!profile || !preferences) {
      return new Response(
        JSON.stringify({ error: "Request body must include `profile` and `preferences`." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------------------------------
    // STEP 2: RETRIEVE — Vector Similarity Search (the "R" in RAG)
    // -----------------------------------------------------------------------
    // Build a rich, descriptive text string that summarizes the user's yard.
    // This string will be embedded and matched against the plant embeddings.
    const queryText = [
      profile.estimated_microclimate ?? "",
      profile.estimated_sun_exposure ?? "",
      `Zone ${profile.hardiness_zone}`,
      `Soil: ${(profile.soil as Record<string, unknown>)?.soil_texture ?? ""}`,
      `${(profile.soil as Record<string, unknown>)?.drainage ?? ""} drainage`,
      preferences.purpose ?? "",
    ].filter(Boolean).join(". ");

    // Call the Dedalus Embeddings API to get a 1536-dim vector for the query text.
    const queryEmbedding = await getEmbedding(queryText, dedalusApiKey);

    // Call the `match_plants` Postgres RPC to find the top 8 most similar plants
    // using cosine similarity (defined in supabase/migrations/..._match_plants_rpc.sql).
    const { data: matchedPlants, error: rpcError } = await supabaseClient.rpc(
      "match_plants",
      {
        query_embedding: queryEmbedding, // 1536-dim vector from Dedalus
        match_threshold: 0.70,          // Plants must be at least 70% similar
        match_count: 8,                 // Fetch top 8 candidates for the LLM to rank
      }
    );

    if (rpcError) {
      throw new Error(`Supabase match_plants RPC failed: ${rpcError.message}`);
    }

    // -----------------------------------------------------------------------
    // STEP 3: AUGMENT — Format matched plants as readable context for the LLM
    // -----------------------------------------------------------------------
    // Convert the matched Supabase rows into a compact readable text block.
    // This text is injected into the LLM's system prompt so it only "knows"
    // about plants that are relevant to this specific user's yard.
    let ragContext: string;
    if (!matchedPlants || matchedPlants.length === 0) {
      // Fallback: if vector search returns nothing (e.g. too-high threshold),
      // fetch a broad sample from the database to give the LLM *something* to work with.
      const { data: fallbackPlants } = await supabaseClient
        .from("rag_plants")
        .select("*")
        .lte("min_hardiness_zone", profile.hardiness_zone)
        .gte("max_hardiness_zone", profile.hardiness_zone)
        .limit(10);

      ragContext = (fallbackPlants ?? []).map((p: Record<string, unknown>) =>
        `- ${p.common_name} (${p.scientific_name}): Zone ${p.min_hardiness_zone}-${p.max_hardiness_zone}. Sun: ${p.sun_requirements}. Water: ${p.water_requirement}. Toxic: ${p.is_toxic_to_pets}. ${p.description}`
      ).join("\n");
    } else {
      ragContext = matchedPlants.map((p: Record<string, unknown>) =>
        `- ${p.common_name} (${p.scientific_name}) [similarity: ${Number(p.similarity).toFixed(2)}]: Zone ${p.min_hardiness_zone}-${p.max_hardiness_zone}. Sun: ${p.sun_requirements}. Water: ${p.water_requirement}. Toxic to pets: ${p.is_toxic_to_pets}. Height: ${p.mature_height_meters}m. ${p.description}`
      ).join("\n");
    }

    // -----------------------------------------------------------------------
    // STEP 4: GENERATE — Get personalized recommendations from Dedalus LLM
    // -----------------------------------------------------------------------
    const recommendations = await getLLMRecommendations(
      profile,
      preferences,
      ragContext,
      dedalusApiKey
    ) as any[];

    // -----------------------------------------------------------------------
    // STEP 4b: AUGMENT — Fetch real plant images from Wikipedia for the UI
    // -----------------------------------------------------------------------
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        if (rec.scientific_name) {
          const imageUrl = await getWikipediaImageUrl(rec.scientific_name);
          if (imageUrl) {
            rec.image_url = imageUrl;
          }
        }
        return rec;
      })
    );

    // -----------------------------------------------------------------------
    // STEP 5: Return successful response to the client
    // -----------------------------------------------------------------------
    return new Response(
      JSON.stringify(enrichedRecommendations),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    // Log the error server-side for debugging, but return a clean error to the client.
    console.error("[get-recommendations] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
