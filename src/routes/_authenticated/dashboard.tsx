import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Pill, Clock, Sparkles, Upload, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const displayName =
    (user?.user_metadata as { display_name?: string } | undefined)?.display_name ||
    user?.email?.split("@")[0] ||
    "there";

  const { data: uploads } = useQuery({
    queryKey: ["uploads", "recent", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["uploads", "stats", user?.id],
    queryFn: async () => {
      const [reports, prescriptions, insights] = await Promise.all([
        supabase.from("uploads").select("*", { count: "exact", head: true }).eq("kind", "report"),
        supabase
          .from("uploads")
          .select("*", { count: "exact", head: true })
          .eq("kind", "prescription"),
        supabase
          .from("uploads")
          .select("*", { count: "exact", head: true })
          .eq("status", "complete"),
      ]);
      if (reports.error) throw reports.error;
      if (prescriptions.error) throw prescriptions.error;
      if (insights.error) throw insights.error;
      return {
        reportsCount: reports.count ?? 0,
        prescriptionsCount: prescriptions.count ?? 0,
        insightsCount: insights.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const reportsCount = stats?.reportsCount ?? 0;
  const prescriptionsCount = stats?.prescriptionsCount ?? 0;
  const insightsCount = stats?.insightsCount ?? 0;
  const lastUpload = uploads?.[0] ? new Date(uploads[0].created_at).toLocaleDateString() : "—";

  return (
    <AppShell
      title="Dashboard"
      subtitle="Your recent analyses and insights"
      actions={
        <Button asChild size="sm" className="rounded-full">
          <Link to="/upload">
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
          </Link>
        </Button>
      }
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Hello, {displayName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a report or prescription to get started with an AI-powered explanation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FileText}
            label="Reports analyzed"
            value={String(reportsCount)}
            tint="primary"
          />
          <StatCard
            icon={Pill}
            label="Prescriptions"
            value={String(prescriptionsCount)}
            tint="accent"
          />
          <StatCard icon={Clock} label="Last upload" value={lastUpload} tint="muted" />
          <StatCard
            icon={Sparkles}
            label="Health insights"
            value={String(insightsCount)}
            tint="success"
          />
        </div>

        {!uploads || uploads.length === 0 ? (
          <Card className="rounded-2xl border-border/70 bg-card p-8 text-center shadow-[var(--shadow-soft)]">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              <Upload className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No analyses yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Upload your first medical report or prescription. We support PDF, PNG, JPG, and WEBP.
            </p>
            <div className="mt-5">
              <Button asChild className="rounded-full">
                <Link to="/upload">
                  Upload your first file <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Recent uploads</h3>
              <Link to="/history" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {uploads.map((row) => (
                <Card
                  key={row.id}
                  className="flex items-center gap-3 rounded-2xl border-border/70 bg-card p-4 shadow-[var(--shadow-soft)]"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{row.file_name}</p>
                  <Badge variant="secondary" className="capitalize">
                    {row.kind}
                  </Badge>
                  {row.status !== "complete" && (
                    <Badge variant={row.status === "error" ? "destructive" : "outline"}>
                      {row.status}
                    </Badge>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tint: "primary" | "accent" | "muted" | "success";
}) {
  const tintClass = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent text-accent-foreground",
    muted: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
  }[tint];
  return (
    <Card className="rounded-2xl border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${tintClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
