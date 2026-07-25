import { FileText, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Tables } from "@/integrations/supabase/types";

export type QueueStatus = "uploading" | "saving" | "analyzing" | "complete" | "error";

export type QueueItem = {
  localId: string;
  file: File;
  previewUrl: string | null;
  status: QueueStatus;
  progress: number;
  errorMessage?: string;
  upload?: Tables<"uploads">;
};

const STATUS_LABEL: Record<QueueStatus, string> = {
  uploading: "Uploading…",
  saving: "Saving…",
  analyzing: "Reading document with AI…",
  complete: "Done",
  error: "Failed",
};

export function UploadItemCard({ item, onDismiss }: { item: QueueItem; onDismiss: () => void }) {
  const isPdf = item.file.type === "application/pdf";
  const isBusy = item.status !== "complete" && item.status !== "error";

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-4 p-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
          {isPdf || !item.previewUrl ? (
            <FileText className="h-6 w-6 text-muted-foreground" />
          ) : (
            <img
              src={item.previewUrl}
              alt={item.file.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{item.file.name}</p>
            {item.upload?.kind && (
              <Badge variant="secondary" className="shrink-0 capitalize">
                {item.upload.kind}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {(item.file.size / 1024 / 1024).toFixed(2)} MB
          </p>

          {isBusy && (
            <div className="mt-3 space-y-1.5">
              <Progress value={item.progress} className="h-1.5" />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {STATUS_LABEL[item.status]}
              </p>
            </div>
          )}

          {item.status === "error" && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {item.errorMessage ?? "Something went wrong."}
            </p>
          )}

          {item.status === "complete" && item.upload?.explanation && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Analysis ready
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground"
          onClick={onDismiss}
          aria-label="Remove"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {item.status === "complete" && item.upload?.explanation && (
        <div className="border-t border-border/60 bg-muted/30 px-4 py-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" />
            Plain-language explanation
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
            {item.upload.explanation}
          </p>
        </div>
      )}
    </Card>
  );
}
