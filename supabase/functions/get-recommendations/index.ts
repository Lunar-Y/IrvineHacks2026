// =============================================================================
// LAWNLENS: get-recommendations Edge Function (Visual-First Edition)
// =============================================================================
// File: supabase/functions/get-recommendations/index.ts
//
// PURPOSE:
//   This version implements "Visual-First" RAG:
//     1. RETRIEVE: Fetch top 15 candidate plants from the DB.
//     2. VERIFY: Fetch Wikipedia images for ALL 15 candidates in parallel.
//     3. FILTER: Drop any plants that do not have a confirmed Wikipedia image.
//     4. GENERATE: Pass the visual-ready plants to Dedalus LLM to pick the final top 5.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEDALUS_BASE_URL = "https://api.dedaluslabs.ai/v1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------------------------------------------------------------------------
// HELPER: Wikipedia Image Fetcher
// ---------------------------------------------------------------------------
async function getWikipediaData(scientificName: string): Promise<{ imageUrl: string | null; summary: string | null }> {
  try {
    const title = encodeURIComponent(scientificName.replace(/\s+/g, "_"));
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { "User-Agent": "LawnLens/1.0 (https://lawnlens.app; contact@lawnlens.app)" }
    });

    if (!response.ok) return { imageUrl: null, summary: null };

    const data = await response.json();
    return {
      imageUrl: data.originalimage?.source || data.thumbnail?.source || null,
      summary: data.extract || null
    };
  } catch (error) {
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
  const systemPrompt = `You are an expert landscape architect. 
Pick the EXACTLY 5 best plants from the IMAGE-VERIFIED matches provided below. 
These plants are guaranteed to have photos. Do NOT suggest plants not in the list.

IMAGE-VERIFIED CANDIDATES:
${ragContext}

USER YARD PROFILE:
- Zone: ${profile.hardiness_zone}
- Sun: ${profile.estimated_sun_exposure ?? "unknown"}
- Soil: ${(profile.soil as any)?.soil_texture ?? "unknown"} / ${(profile.soil as any)?.drainage ?? "unknown"}
- Has Pets: ${profile.has_pets ? "Yes" : "No"}

USER PREFERENCES:
- Purpose: ${preferences.purpose}

Return ONLY a valid JSON array of 5 objects. No markdown.
Structure:
{
  "common_name": "string",
  "scientific_name": "string",
  "why_it_fits": "2-sentence explanation",
  "mature_height_meters": number,
  "water_requirement": "low | medium | high",
  "care_difficulty": "easy | moderate | hard",
  "is_toxic_to_pets": boolean,
  "is_toxic_to_humans": boolean,
  "care_tip": "string"
}`;

  const response = await fetch(`${DEDALUS_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      messages: [{ role: "user", content: systemPrompt }],
      temperature: 0.1,
    }),
  });

  if (!response.ok) throw new Error("LLM Error");
  const data = await response.json();
  const rawContent = data.choices[0].message.content;

  try {
    return JSON.parse(rawContent);
  } catch {
    const match = rawContent.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error("JSON Parse Error");
  }
}

// ---------------------------------------------------------------------------
// MAIN EDGE FUNCTION HANDLER
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const dedalusApiKey = Deno.env.get("DEDALUS_API_KEY");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { profile, preferences } = await req.json();

    const queryText = [
      profile.estimated_microclimate ?? "",
      profile.estimated_sun_exposure ?? "",
      `Zone ${profile.hardiness_zone}`,
      preferences.purpose ?? "",
    ].filter(Boolean).join(". ");

    const queryEmbedding = await getEmbedding(queryText, dedalusApiKey!);

    // 1. Fetch more candidates (15) to ensure we have enough after filtering
    const { data: matchedPlants } = await supabaseClient.rpc("match_plants", {
      query_embedding: queryEmbedding,
      match_threshold: 0.60,
      match_count: 15,
    });

    // 2. Parallel Verify Wikipedia images for all candidates
    const verificationResults = await Promise.all(
      (matchedPlants || []).map(async (p: any) => {
        const wiki = await getWikipediaData(p.scientific_name);
        return { ...p, ...wiki };
      })
    );

    // 3. FILTER: Only keep plants that actually have an image
    const visualReadyPlants = verificationResults.filter(p => p.imageUrl !== null);

    // Fallback if filtering was too aggressive (rare with 15 candidates)
    const finalPool = visualReadyPlants.length > 0 ? visualReadyPlants : verificationResults;

    const ragContext = finalPool.map((p: any) =>
      `- ${p.common_name} (${p.scientific_name}): ${p.description}`
    ).join("\n");

    const recommendations = await getLLMRecommendations(
      profile,
      preferences,
      ragContext,
      dedalusApiKey!
    );

    // 4. Map the final AI selection to their verified image URLs
    const finalRecommendations = (recommendations as any[]).map(rec => {
      const match = finalPool.find(p => p.scientific_name === rec.scientific_name);
      return {
        ...rec,
        image_url: match?.imageUrl || null,
        wikipedia_summary: match?.summary || null,
      };
    });

    return new Response(JSON.stringify(finalRecommendations), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
