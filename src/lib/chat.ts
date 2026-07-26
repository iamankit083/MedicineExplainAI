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

const OPENROUTER_MODEL = "google/gemini-2.5-flash";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Chat is not configured (missing OPENROUTER_API_KEY).");
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

    // OpenRouter follows the OpenAI chat-completions shape: a "messages" array
    // with the system prompt as its own message and "assistant" for the AI turn.
    const messages = [
      { role: "system", content: systemPrompt },
      ...data.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        max_tokens: 1000,
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
    return { reply: text };
  });
