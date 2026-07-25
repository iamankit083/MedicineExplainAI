import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchMedicine } from "@/lib/search-medicine";
import { Pill, Loader2, AlertTriangle, PackageCheck, Search } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/medicines")({
  component: MedicinesPage,
});

type MedicineResult = Tables<"medicine_lookups">;

function MedicinesPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicineResult | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await searchMedicine({ data: { query: trimmed } });
      setResult(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Medicine search" subtitle="Look up any medicine">
      <div className="space-y-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Metformin, Amoxicillin, Paracetamol"
            className="h-11"
          />
          <Button type="submit" className="h-11 shrink-0" disabled={loading || !query.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="mr-1.5 h-4 w-4" /> Search
              </>
            )}
          </Button>
        </form>

        {loading && (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!loading && !result && (
          <EmptyState
            icon={Pill}
            title="Search for a medicine"
            body="Search by medicine name for uses, general dosage information, side effects, warnings, and storage."
          />
        )}

        {!loading && result && (
          <div className="space-y-4">
            <Card className="rounded-2xl border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
                  <Pill className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{result.name}</h3>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
              <h4 className="text-sm font-semibold">Uses</h4>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                {result.uses}
              </p>
            </Card>

            <Card className="rounded-2xl border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
              <h4 className="text-sm font-semibold">General dosage information</h4>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                {result.dosage}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Always follow the exact dose your doctor or pharmacist prescribes.
              </p>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-2xl border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Side effects
                </h4>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {result.side_effects.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </Card>
              <Card className="rounded-2xl border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Warnings
                </h4>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {result.warnings.map((w) => (
                    <Badge key={w} variant="destructive">
                      {w}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="rounded-2xl border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                <PackageCheck className="h-4 w-4 text-success" /> Storage
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{result.storage}</p>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              AI-generated, general information only — not a substitute for advice from a pharmacist
              or doctor.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
