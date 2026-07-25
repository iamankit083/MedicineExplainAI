import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { sendChatMessage } from "@/lib/chat";
import { MessageCircle, Send, Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

type ChatMessage = { role: "user" | "assistant"; content: string };

function ChatPage() {
  const { user } = Route.useRouteContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [uploadId, setUploadId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: uploads } = useQuery({
    queryKey: ["uploads-for-chat", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("uploads")
        .select("id, file_name, kind, status")
        .eq("status", "complete")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const result = await sendChatMessage({ data: { messages: next, uploadId } });
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
      setMessages(next);
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell title="Ask AI" subtitle="Educational answers about your report">
      <div className="flex h-[calc(100vh-11rem)] flex-col gap-3">
        <Card className="flex items-center gap-3 rounded-2xl border-border/70 bg-card p-3 shadow-[var(--shadow-soft)]">
          <span className="shrink-0 text-xs font-medium text-muted-foreground">Context:</span>
          <Select
            value={uploadId ?? "none"}
            onValueChange={(value) => setUploadId(value === "none" ? undefined : value)}
          >
            <SelectTrigger className="h-8 w-full max-w-xs text-xs">
              <SelectValue placeholder="No report selected" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No report — general questions</SelectItem>
              {uploads?.map((row) => (
                <SelectItem key={row.id} value={row.id}>
                  {row.file_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="flex flex-1 flex-col overflow-hidden rounded-2xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Ask about a report or medicine</h3>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    Try "What is LDL?" or pick a report above and ask "What does this mean for me?"
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {message.role === "assistant" && (
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[image:var(--gradient-primary)]">
                    <Stethoscope className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex items-start gap-2.5">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[image:var(--gradient-primary)]">
                  <Stethoscope className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 border-t border-border/60 p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Ask a question…"
              className="min-h-[44px] resize-none"
              rows={1}
            />
            <Button
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full"
              disabled={sending || !input.trim()}
              onClick={() => void handleSend()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
