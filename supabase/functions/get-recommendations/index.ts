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
//     4. ENRICH: Fetch real-world images from Wikipedia for each recommendation.
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
//   Array of 5 plant recommendations with reasoning, care data, and Wikipedia images.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const DEDALUS_BASE_URL = "https://api.dedaluslabs.ai/v1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------------------------------------------------------------------------
// HELPER: Wikipedia Image Fetcher
// ---------------------------------------------------------------------------
/**
 * Fetches a high-quality representative image and summary from Wikipedia.
 * Uses the clean REST API: /page/summary/{title}
 */
async function getWikipediaData(scientificName: string): Promise<{ imageUrl: string | null; summary: string | null }> {
  try {
    // Sanitize title for URL (replace spaces with underscores)
    const title = encodeURIComponent(scientificName.replace(/\s+/g, "_"));
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { "User-Agent": "LawnLens/1.0 (https://lawnlens.app; contact@lawnlens.app)" }
    });

    if (!response.ok) {
      console.warn(`[Wikipedia] No page found for: ${scientificName} (${response.status})`);
      return { imageUrl: null, summary: null };
    }

    const data = await response.json();
    return {
      imageUrl: data.originalimage?.source || data.thumbnail?.source || null,
      summary: data.extract || null
    };
  } catch (error) {
    console.error(`[Wikipedia] Fetch failed for ${scientificName}:`, error);
    return { imageUrl: null, summary: null };
  }
}

// ---------------------------------------------------------------------------
// HELPER: Dedalus Text Embedding API
// ---------------------------------------------------------------------------
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
  return data.data[0].embedding;
}

// ---------------------------------------------------------------------------
// HELPER: Dedalus LLM Chat Completion (Generation Step)
// ---------------------------------------------------------------------------
async function getLLMRecommendations(
  profile: Record<string, unknown>,
  preferences: Record<string, unknown>,
  ragContext: string,
  apiKey: string
): Promise<unknown[]> {
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
  "care_tip": "One actionable care tip specific to this user's climate"
}`;

  const response = await fetch(`${DEDALUS_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      messages: [
        { role: "user", content: systemPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Dedalus Chat API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const rawContent: string = data.choices[0].message.content;

  try {
    return JSON.parse(rawContent);
  } catch {
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const dedalusApiKey = Deno.env.get("DEDALUS_API_KEY");
    if (!dedalusApiKey) {
      throw new Error("DEDALUS_API_KEY is not set in Supabase Secrets.");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { profile, preferences } = await req.json();

    if (!profile || !preferences) {
      return new Response(
        JSON.stringify({ error: "Request body must include `profile` and `preferences`." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const queryText = [
      profile.estimated_microclimate ?? "",
      profile.estimated_sun_exposure ?? "",
      `Zone ${profile.hardiness_zone}`,
      `Soil: ${(profile.soil as Record<string, unknown>)?.soil_texture ?? ""}`,
      `${(profile.soil as Record<string, unknown>)?.drainage ?? ""} drainage`,
      preferences.purpose ?? "",
    ].filter(Boolean).join(". ");

    const queryEmbedding = await getEmbedding(queryText, dedalusApiKey);

    const { data: matchedPlants, error: rpcError } = await supabaseClient.rpc(
      "match_plants",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.70,
        match_count: 8,
      }
    );

    if (rpcError) {
      throw new Error(`Supabase match_plants RPC failed: ${rpcError.message}`);
    }

    let ragContext: string;
    if (!matchedPlants || matchedPlants.length === 0) {
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

    const recommendations = await getLLMRecommendations(
      profile,
      preferences,
      ragContext,
      dedalusApiKey
    );

    // STEP 4: ENRICHMENT — Fetch real images from Wikipedia
    const enrichedRecommendations = await Promise.all(
      (recommendations as any[]).map(async (plant) => {
        const wikiData = await getWikipediaData(plant.scientific_name);
        return {
          ...plant,
          image_url: wikiData.imageUrl,
          wikipedia_summary: wikiData.summary,
        };
      })
    );

    return new Response(
      JSON.stringify(enrichedRecommendations),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
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
