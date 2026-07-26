import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MEDICINE_SYSTEM_PROMPT = `You provide general, educational information about medicines for a
patient-facing app. You are not a doctor and must never give a personal dosage
recommendation or tell someone to take or stop taking something.

Given a medicine name, respond with ONLY a JSON object (no markdown fences, no
commentary) with this exact shape:
{
  "name": string,               // the medicine's common/generic name, correctly spelled
  "summary": string,            // one sentence: what class of medicine it is
  "uses": string,                // 1-2 short paragraphs on what it's generally used for
  "dosage": string,              // 1 short paragraph of GENERAL dosage information
                                  // (e.g. typical forms/strengths), always saying the
                                  // exact dose must come from a doctor or pharmacist
  "side_effects": string[],      // 4-8 common side effects, short phrases
  "warnings": string[],          // 3-6 important warnings/interactions, short phrases
  "storage": string              // 1 short sentence on how it's typically stored
}
If the input is not a recognizable medicine name, set "name" to the input as given
and explain in "summary" that it wasn't recognized, leaving the other fields as
short honest placeholders (e.g. "Not available").`;

const inputSchema = z.object({
  query: z.string().trim().min(1).max(120),
});

type MedicineResult = {
  name: string;
  summary: string;
  uses: string;
  dosage: string;
  side_effects: string[];
  warnings: string[];
  storage: string;
};

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

function normalizeKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export const searchMedicine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const queryKey = normalizeKey(data.query);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cached } = await supabaseAdmin
      .from("medicine_lookups")
      .select("*")
      .eq("query_key", queryKey)
      .maybeSingle();

    if (cached) {
      return cached;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Medicine search is not configured (missing OPENROUTER_API_KEY).");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.6",
        max_tokens: 1200,
        messages: [
          { role: "system", content: MEDICINE_SYSTEM_PROMPT },
          { role: "user", content: `Medicine name: ${data.query}` },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${body.slice(0, 500)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(stripJsonFences(text)) as MedicineResult;

    const { data: saved, error: insertError } = await supabaseAdmin
      .from("medicine_lookups")
      .upsert(
        {
          query_key: queryKey,
          name: parsed.name,
          summary: parsed.summary,
          uses: parsed.uses,
          dosage: parsed.dosage,
          side_effects: parsed.side_effects ?? [],
          warnings: parsed.warnings ?? [],
          storage: parsed.storage,
        },
        { onConflict: "query_key" },
      )
      .select("*")
      .single();

    if (insertError || !saved) {
      // Cache write failed — still return the freshly generated result.
      return {
        id: "uncached",
        query_key: queryKey,
        name: parsed.name,
        summary: parsed.summary,
        uses: parsed.uses,
        dosage: parsed.dosage,
        side_effects: parsed.side_effects ?? [],
        warnings: parsed.warnings ?? [],
        storage: parsed.storage,
        created_at: new Date().toISOString(),
      };
    }

    return saved;
  });
