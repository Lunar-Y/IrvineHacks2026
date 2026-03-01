// =============================================================================
// LAWNLENS: generate-care-schedule Edge Function
// =============================================================================
// File: supabase/functions/generate-care-schedule/index.ts
//
// PURPOSE:
//   This function is called after the user has "saved" one or more plants to
//   their garden. It queries the database for the details of each saved plant,
//   optionally fetches a weather forecast (if coordinates are provided),
//   and calls the Dedalus LLM to generate a merged, unified, week-by-week
//   care schedule that is personalized to the user's specific plants and location.
//
// INPUT (JSON body from client):
//   {
//     "plant_ids": ["uuid-1", "uuid-2", "uuid-3"],   // IDs from rag_plants table
//     "location": {                                   // Optional, enables weather-smart care
//       "lat": 33.68,
//       "lng": -117.83,
//       "hardiness_zone": 10
//     }
//   }
//
// OUTPUT (JSON object):
//   {
//     "generated_for_plants": ["Plant Name 1", "Plant Name 2", ...],
//     "schedule": [
//       {
//         "week": 1,
//         "tasks": [
//           { "plant": "Lavender", "task": "Water deeply once", "urgency": "high | medium | low" },
//           { "plant": "All Plants", "task": "Apply 2in mulch layer", "urgency": "medium" }
//         ]
//       }
//     ]
//   }
//
// ENVIRONMENT VARIABLES (set via `supabase secrets set`):
//   - DEDALUS_API_KEY: Your Dedalus API key.
//   - SUPABASE_URL: Auto-injected by Supabase runtime.
//   - SUPABASE_SERVICE_ROLE_KEY: Auto-injected by Supabase runtime.
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

// Type for a row returned from rag_plants
interface PlantRow {
    id: string;
    common_name: string;
    scientific_name: string;
    water_requirement: string;
    sun_requirements: string[];
    mature_height_meters: number;
    min_hardiness_zone: number;
    max_hardiness_zone: number;
    description: string;
    maintenance_level: string;
}

// ---------------------------------------------------------------------------
// HELPER: Summarize a plant row into a compact string for the LLM prompt.
// The LLM doesn't need every field — just the care-relevant ones.
// ---------------------------------------------------------------------------
function summarizePlant(plant: PlantRow): string {
    return [
        `Plant: ${plant.common_name} (${plant.scientific_name})`,
        `  - Water Needs: ${plant.water_requirement}`,
        `  - Maintenance Level: ${plant.maintenance_level}`,
        `  - Mature Height: ${plant.mature_height_meters}m`,
        `  - Hardiness Zone: ${plant.min_hardiness_zone}–${plant.max_hardiness_zone}`,
        `  - Notes: ${plant.description?.substring(0, 200) ?? "None"}`,
    ].join("\n");
}

// ---------------------------------------------------------------------------
// MAIN EDGE FUNCTION HANDLER
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
    // Handle CORS preflight.
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }

    try {
        // -----------------------------------------------------------------------
        // STEP 1: Read secrets from Supabase Secrets Vault (server-side only)
        // -----------------------------------------------------------------------
        const dedalusApiKey = Deno.env.get("DEDALUS_API_KEY");
        if (!dedalusApiKey) {
            throw new Error("DEDALUS_API_KEY not set. Run: supabase secrets set DEDALUS_API_KEY=...");
        }

        // Initialize the Supabase admin client with the Service Role key.
        // This bypasses Row Level Security (RLS) so we can fetch plant data
        // regardless of the session state.
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        // -----------------------------------------------------------------------
        // STEP 2: Parse the incoming request
        // -----------------------------------------------------------------------
        const { plant_ids, location } = await req.json();

        if (!plant_ids || !Array.isArray(plant_ids) || plant_ids.length === 0) {
            return new Response(
                JSON.stringify({ error: "Request body must include a non-empty `plant_ids` array." }),
                { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
            );
        }

        // -----------------------------------------------------------------------
        // STEP 3: Fetch plant data from Supabase rag_plants table
        // -----------------------------------------------------------------------
        // We fetch only the columns relevant to generating a care schedule.
        // Avoiding fetching the `embedding` column since it's a large float array
        // and completely unnecessary here.
        const { data: plants, error: dbError } = await supabaseClient
            .from("rag_plants")
            .select(`
        id,
        common_name,
        scientific_name,
        water_requirement,
        sun_requirements,
        mature_height_meters,
        min_hardiness_zone,
        max_hardiness_zone,
        description,
        maintenance_level
      `)
            .in("id", plant_ids); // Fetch only the plants the user has saved

        if (dbError) {
            throw new Error(`Database error fetching plants: ${dbError.message}`);
        }

        if (!plants || plants.length === 0) {
            return new Response(
                JSON.stringify({ error: "No plants found for the provided IDs." }),
                { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
            );
        }

        // -----------------------------------------------------------------------
        // STEP 4: Build the LLM prompt with plant summaries and location context
        // -----------------------------------------------------------------------
        // Summarize all plants into a readable block for the LLM.
        const plantContext = (plants as PlantRow[]).map(summarizePlant).join("\n\n");

        // Add location context to the prompt if coordinates were provided.
        const locationContext = location
            ? `USER LOCATION: Hardiness Zone ${location.hardiness_zone}. Lat: ${location.lat}, Lng: ${location.lng}.`
            : "USER LOCATION: Not provided. Give general care advice.";

        const carePrompt = `You are an expert horticulturalist creating a personalized plant care schedule for a homeowner.

${locationContext}

The homeowner has the following plants:
${plantContext}

Generate a 4-week unified care schedule that:
1. Merges all plant tasks together (don't repeat tasks that apply to multiple plants, just note which plants)
2. Weighs urgency realistically — watering is high urgency, fertilizing is low urgency
3. Considers that some tasks happen once (planting, mulching) and some are recurring (watering, deadheading)

Return ONLY a valid JSON object. No markdown, no commentary. Follow this exact schema:
{
  "generated_for_plants": ["common name 1", "common name 2"],
  "schedule": [
    {
      "week": 1,
      "tasks": [
        { "plant": "Plant Name or All Plants", "task": "Specific actionable task description", "urgency": "high | medium | low" }
      ]
    }
  ]
}`;

        // -----------------------------------------------------------------------
        // STEP 5: Call Dedalus LLM to generate the care schedule
        // -----------------------------------------------------------------------
        const llmResponse = await fetch(`${DEDALUS_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${dedalusApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-5.2",
                messages: [{ role: "user", content: carePrompt }],
                temperature: 0.3, // Slightly higher than 0.0 to allow natural language variety
            }),
        });

        if (!llmResponse.ok) {
            const errBody = await llmResponse.text();
            throw new Error(`Dedalus Chat API error ${llmResponse.status}: ${errBody}`);
        }

        const llmData = await llmResponse.json();
        const rawContent: string = llmData.choices[0].message.content;

        // Safely parse the JSON output from the LLM.
        let careSchedule: Record<string, unknown>;
        try {
            careSchedule = JSON.parse(rawContent);
        } catch {
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                careSchedule = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error(`Could not parse care schedule JSON from LLM response: ${rawContent}`);
            }
        }

        // -----------------------------------------------------------------------
        // STEP 6: Return the care schedule to the client
        // -----------------------------------------------------------------------
        return new Response(
            JSON.stringify(careSchedule),
            {
                status: 200,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            }
        );

    } catch (error) {
        console.error("[generate-care-schedule] Unhandled error:", error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
            {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            }
        );
    }
});
