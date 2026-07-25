import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { UploadRecordCard } from "@/components/upload-record-card";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/saved")({
  component: SavedPage,
});

function SavedPage() {
  const { user } = Route.useRouteContext();

  const {
    data: uploads,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["saved-uploads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .eq("saved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <AppShell title="Saved reports" subtitle="Your bookmarked analyses">
      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !uploads || uploads.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          body="Star or save analyses to keep them handy here."
        />
      ) : (
        <div className="space-y-3">
          {uploads.map((row) => (
            <UploadRecordCard key={row.id} row={row} onSavedChange={() => void refetch()} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
