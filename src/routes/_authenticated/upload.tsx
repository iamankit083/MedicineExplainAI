import { useCallback, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadItemCard, type QueueItem } from "@/components/upload-item-card";
import { supabase } from "@/integrations/supabase/client";
import { analyzeUpload } from "@/lib/analyze-upload";
import { Upload as UploadIcon, FileImage, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/upload")({
  component: UploadPage,
});

const ACCEPTED_MIME = ["image/png", "image/jpeg", "image/webp", "image/heic", "application/pdf"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB, matches the storage bucket limit

function fileTypeOf(file: File): "image" | "pdf" {
  return file.type === "application/pdf" ? "pdf" : "image";
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function UploadPage() {
  const { user } = Route.useRouteContext();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateItem = useCallback((localId: string, patch: Partial<QueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, ...patch } : item)),
    );
  }, []);

  const processFile = useCallback(
    async (localId: string, file: File) => {
      if (!user) return;
      try {
        updateItem(localId, { status: "uploading", progress: 20 });

        const path = `${user.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("medical-files")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error(uploadError.message);

        updateItem(localId, { status: "saving", progress: 55 });

        const { data: row, error: insertError } = await supabase
          .from("uploads")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: path,
            file_type: fileTypeOf(file),
            mime_type: file.type,
            size_bytes: file.size,
          })
          .select("*")
          .single();
        if (insertError || !row) throw new Error(insertError?.message ?? "Could not save upload");

        updateItem(localId, { status: "analyzing", progress: 75, upload: row });

        await analyzeUpload({ data: { uploadId: row.id } });

        const { data: finalRow, error: refetchError } = await supabase
          .from("uploads")
          .select("*")
          .eq("id", row.id)
          .single();
        if (refetchError || !finalRow)
          throw new Error(refetchError?.message ?? "Could not load results");

        if (finalRow.status === "error") {
          throw new Error(finalRow.error_message ?? "Analysis failed");
        }

        updateItem(localId, { status: "complete", progress: 100, upload: finalRow });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong";
        updateItem(localId, { status: "error", errorMessage: message });
        toast.error(message);
      }
    },
    [user, updateItem],
  );

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      for (const file of files) {
        if (!ACCEPTED_MIME.includes(file.type)) {
          toast.error(`${file.name}: unsupported file type`);
          continue;
        }
        if (file.size > MAX_SIZE_BYTES) {
          toast.error(`${file.name}: file is larger than 20 MB`);
          continue;
        }
        const localId = crypto.randomUUID();
        const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
        const item: QueueItem = { localId, file, previewUrl, status: "uploading", progress: 0 };
        setQueue((prev) => [item, ...prev]);
        void processFile(localId, file);
      }
    },
    [processFile],
  );

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function dismiss(localId: string) {
    setQueue((prev) => {
      const target = prev.find((item) => item.localId === localId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.localId !== localId);
    });
  }

  return (
    <AppShell title="Upload" subtitle="Add a report or prescription to analyze">
      <div className="space-y-6">
        <Card
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center shadow-[var(--shadow-soft)] transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-border/70 bg-card"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_MIME.join(",")}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <UploadIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Drag & drop files here</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            or click to browse. We accept blood test reports, scanned documents, and handwritten
            prescriptions.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileImage className="h-3.5 w-3.5" /> JPG, PNG, WEBP, HEIC
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> PDF
            </span>
            <span>Up to 20 MB</span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Browse files
          </Button>
        </Card>

        {queue.length > 0 && (
          <div className="space-y-3">
            {queue.map((item) => (
              <UploadItemCard
                key={item.localId}
                item={item}
                onDismiss={() => dismiss(item.localId)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
