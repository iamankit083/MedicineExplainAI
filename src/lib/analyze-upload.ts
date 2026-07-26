// Server-only. Runs after a file has been uploaded to Supabase Storage: downloads
// it with the user's own (RLS-scoped) session, sends it to Gemini for OCR + a
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

const GEMINI_MODEL = "gemini-2.5-flash";

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
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("AI analysis is not configured (missing GEMINI_API_KEY).");
      }

      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from("medical-files")
        .download(upload.file_path);

      if (downloadError || !fileBlob) {
        throw new Error(downloadError?.message ?? "Could not download the uploaded file");
      }

      const arrayBuffer = await fileBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      const mimeType = upload.file_type === "pdf" ? "application/pdf" : upload.mime_type;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: ANALYSIS_SYSTEM_PROMPT }] },
            contents: [
              {
                role: "user",
                parts: [
                  { inline_data: { mime_type: mimeType, data: base64 } },
                  { text: "Analyze this document." },
                ],
              },
            ],
            generationConfig: { maxOutputTokens: 2000 },
          }),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${body.slice(0, 500)}`);
      }

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
