import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, AlertCircle, Star } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export function UploadRecordCard({
  row,
  onSavedChange,
}: {
  row: Tables<"uploads">;
  onSavedChange?: (id: string, saved: boolean) => void;
}) {
  const [saved, setSaved] = useState(row.saved);
  const [toggling, setToggling] = useState(false);

  async function toggleSaved() {
    if (toggling) return;
    const next = !saved;
    setToggling(true);
    setSaved(next);
    const { error } = await supabase.from("uploads").update({ saved: next }).eq("id", row.id);
    setToggling(false);
    if (error) {
      setSaved(!next);
      toast.error("Could not update saved status");
      return;
    }
    onSavedChange?.(row.id, next);
  }

  return (
    <Card className="rounded-2xl border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="truncate text-sm font-medium">{row.file_name}</p>
        <Badge variant="secondary" className="capitalize">
          {row.kind}
        </Badge>
        {row.status !== "complete" && (
          <Badge variant={row.status === "error" ? "destructive" : "outline"}>{row.status}</Badge>
        )}
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {new Date(row.created_at).toLocaleString()}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={toggleSaved}
          disabled={toggling}
          aria-label={saved ? "Remove from saved" : "Save this analysis"}
        >
          <Star
            className={`h-4 w-4 ${saved ? "fill-warning text-warning" : "text-muted-foreground"}`}
          />
        </Button>
      </div>

      {row.status === "complete" && row.explanation && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
          {row.explanation}
        </p>
      )}
      {row.status === "error" && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {row.error_message ?? "Analysis failed."}
        </p>
      )}
    </Card>
  );
}
