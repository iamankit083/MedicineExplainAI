import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CHAT_SYSTEM_PROMPT = `You are a friendly, careful assistant inside a patient education app.
You explain medical reports, test values, and medicines in clear, plain language.
You are not a doctor: never diagnose, never tell someone what to do about their own
treatment, and always suggest they confirm anything important with a qualified
healthcare professional. Keep answers concise (a few short paragraphs at most)
unless the user asks for more detail.`;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(30),
  uploadId: z.string().uuid().optional(),
});

const GEMINI_MODEL = "gemini-2.5-flash";

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Chat is not configured (missing GEMINI_API_KEY).");
    }

    let systemPrompt = CHAT_SYSTEM_PROMPT;

    if (data.uploadId) {
      const { data: upload } = await context.supabase
        .from("uploads")
        .select("file_name, kind, extracted_text, explanation")
        .eq("id", data.uploadId)
        .eq("user_id", context.userId)
        .maybeSingle();

      if (upload?.extracted_text) {
        systemPrompt += `\n\nThe user is asking about this ${upload.kind} ("${upload.file_name}"). Use it as context when relevant:\n\n--- Extracted text ---\n${upload.extracted_text.slice(0, 6000)}\n\n--- Previous explanation ---\n${(upload.explanation ?? "").slice(0, 3000)}`;
      }
    }

    // Gemini uses "model" instead of "assistant" for the AI turn, and takes
    // the system prompt as a separate top-level field rather than a message.
    const contents = data.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 1000 },
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
    return { reply: text };
  });
