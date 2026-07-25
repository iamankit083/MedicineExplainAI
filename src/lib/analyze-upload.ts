// Server-only. Runs after a file has been uploaded to Supabase Storage: downloads
// it with the user's own (RLS-scoped) session, sends it to Claude for OCR + a
// plain-language explanation, and writes the result back onto the uploads row.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ANALYSIS_SYSTEM_PROMPT = `You read medical reports and handwritten prescriptions for a patient-facing
educational app. You are not a doctor and must never diagnose or prescribe.

Given the attached image or PDF, respond with ONLY a JSON object (no markdown
fences, no commentary) with this exact shape:
{
  "kind": "report" | "prescription",
  "extracted_text": string,   // faithful transcription of all visible text
  "explanation": string       // 3-6 short paragraphs in plain, reassuring language:
                               // what the document contains, what any values or
                               // medicines mean in general terms, and what to ask
                               // a doctor about. Always include a line reminding
                               // the reader this is educational, not medical advice.
}
If the document is illegible or not a medical document, say so honestly in
"explanation" and leave "extracted_text" as an empty string.`;

const inputSchema = z.object({
  uploadId: z.string().uuid(),
});

type AnalysisResult = {
  kind: "report" | "prescription";
  extracted_text: string;
  explanation: string;
};

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

export const analyzeUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { uploadId } = data;

    const { data: upload, error: fetchError } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !upload) {
      throw new Error("Upload not found");
    }

    await supabase.from("uploads").update({ status: "processing" }).eq("id", uploadId);

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("AI analysis is not configured (missing ANTHROPIC_API_KEY).");
      }

      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from("medical-files")
        .download(upload.file_path);

      if (downloadError || !fileBlob) {
        throw new Error(downloadError?.message ?? "Could not download the uploaded file");
      }

      const arrayBuffer = await fileBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      const contentBlock =
        upload.file_type === "pdf"
          ? {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            }
          : {
              type: "image",
              source: { type: "base64", media_type: upload.mime_type, data: base64 },
            };

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          system: ANALYSIS_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [contentBlock, { type: "text", text: "Analyze this document." }],
            },
          ],
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${body.slice(0, 500)}`);
      }

      const payload = (await response.json()) as {
        content: Array<{ type: string; text?: string }>;
      };
      const text = payload.content.find((block) => block.type === "text")?.text ?? "";
      const parsed = JSON.parse(stripJsonFences(text)) as AnalysisResult;

      await supabase
        .from("uploads")
        .update({
          status: "complete",
          kind: parsed.kind === "prescription" ? "prescription" : "report",
          extracted_text: parsed.extracted_text ?? "",
          explanation: parsed.explanation ?? "",
          error_message: null,
        })
        .eq("id", uploadId);

      return { status: "complete" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      await supabase
        .from("uploads")
        .update({ status: "error", error_message: message })
        .eq("id", uploadId);
      throw error;
    }
  });
