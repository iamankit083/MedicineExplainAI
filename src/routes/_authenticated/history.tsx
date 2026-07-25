import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { UploadRecordCard } from "@/components/upload-record-card";
import { supabase } from "@/integrations/supabase/client";
import { History, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = Route.useRouteContext();

  const { data: uploads, isLoading } = useQuery({
    queryKey: ["uploads", "all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: (query) =>
      query.state.data?.some((row) => row.status === "pending" || row.status === "processing")
        ? 3000
        : false,
  });

  return (
    <AppShell title="Analysis history" subtitle="Every report and prescription you've analyzed">
      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !uploads || uploads.length === 0 ? (
        <EmptyState
          icon={History}
          title="No analyses yet"
          body="Once you upload a report or prescription, it will appear here — searchable, renamable, and exportable."
        />
      ) : (
        <div className="space-y-3">
          {uploads.map((row) => (
            <UploadRecordCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
