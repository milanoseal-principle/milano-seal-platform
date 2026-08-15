"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

interface PipelineMatter {
  id: string;
  deal_id: string;
  client_name: string;
  document_type: string;
  destination_country: string;
  lane: string;
  total_price: number;
  canonical_state: string | null;
  raw_state: string | null;
  state_source: "status" | "deal_status" | "none";
  alias_applied: boolean;
  phase: string;
  deal_status: string;
  payment_status: string;
  payment_confirmed: boolean;
  due_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  tracking_number: string | null;
  carrier: string | null;
  delivery_status: string | null;
}

interface CanonicalPhase {
  phase: string;
  label: string;
  count: number;
  total_value: number;
  deals: PipelineMatter[];
}

interface PipelineSummary {
  canonical_phases: CanonicalPhase[];
  matters: PipelineMatter[];
  total_open: number;
  total_value_open: number;
  total_value_closed: number;
  state_mismatch_count: number;
  unresolved_state_count: number;
}

function stateLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "unresolved";
}

export default function Pipeline() {
  const { data, isLoading } = useApi<PipelineSummary>("/api/admin/pipeline");
  const searchParams = useSearchParams();
  const focusMatter = searchParams.get("matter") ?? searchParams.get("deal");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="min-h-[320px] border-gold bg-card">
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-6 text-sm text-red-300/70">
        Canonical pipeline data is unavailable. Do not interpret this as an empty pipeline.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <DashboardPageHeader
          eyebrow="Canonical Execution State Board"
          title="Execution Pipeline"
          description="Read-only operating view projected from canonical Matter state. State changes remain controlled by governed Matter actions — this board does not create a second transition engine."
          primaryAction={{ label: "Open Active Matter", href: "/dashboard/deals" }}
          meta={
            <p className="font-mono text-[11px] text-muted-foreground">
              {data.total_open} open · {formatCurrency(data.total_value_open)} pipeline ·{" "}
              {formatCurrency(data.total_value_closed)} completed
            </p>
          }
        />
      </Reveal>

      {(data.state_mismatch_count > 0 || data.unresolved_state_count > 0) && (
        <section className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-200/70">
            Compatibility Projection Active
          </p>
          <p className="mt-2 text-xs leading-5 text-white/45">
            {data.state_mismatch_count} Matter rows contain historical status/deal_status drift;{" "}
            {data.unresolved_state_count} rows cannot be projected. Historical rows are read through
            compatibility aliases only — no database state is rewritten from this board.
          </p>
        </section>
      )}

      {focusMatter ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#C6A55A]/15 bg-[#C6A55A]/[0.03] px-4 py-3">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#C6A55A]/50">
              Focused Matter
            </p>
            <p className="mt-1 break-all font-mono text-[10px] text-white/50">{focusMatter}</p>
          </div>
          <Link
            href="/dashboard/pipeline"
            className="text-[10px] text-[#E4CA8C]/70 hover:text-[#E4CA8C]"
          >
            Clear
          </Link>
        </div>
      ) : null}

      <div className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] gap-4 overflow-x-auto pb-4">
        {data.canonical_phases.map((phase) => (
          <Card key={phase.phase} className="min-h-[360px] border-gold bg-card">
            <CardHeader className="sticky top-0 z-10 bg-card pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium uppercase tracking-widest">
                  {phase.label}
                </CardTitle>
                <Badge variant="outline" className="rounded-sm border-[#C6A55A]/20 bg-[#C6A55A]/5 text-[#D4AF37]">
                  {phase.count}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formatCurrency(phase.total_value)}</p>
              <div className="gold-rule mt-2" />
            </CardHeader>

            <CardContent className="flex flex-col gap-3 pt-3">
              {phase.deals.length === 0 ? (
                <div className="py-4 text-center text-xs italic text-muted-foreground/50">Empty</div>
              ) : (
                phase.deals.map((matter) => {
                  const focused = focusMatter === matter.id || focusMatter === matter.deal_id;
                  return (
                    <Link key={matter.id} href={`/dashboard/deals/${encodeURIComponent(matter.id)}`}>
                      <div
                        className={`cursor-pointer rounded-lg border p-3 transition-all ${
                          focused
                            ? "border-[#C6A55A]/60 bg-[#C6A55A]/[0.06] shadow-[0_0_0_1px_rgba(198,165,90,0.08)]"
                            : "border-border/80 bg-card hover:border-gold/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-gold">{matter.deal_id}</span>
                          <span className="text-[10px] text-muted-foreground">{matter.lane}</span>
                        </div>

                        <div className="mt-1 truncate text-sm text-foreground">{matter.client_name}</div>
                        <div className="truncate text-xs text-muted-foreground">{matter.document_type}</div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-foreground/80">{matter.destination_country}</span>
                          <span className="text-xs font-medium text-gold">{formatCurrency(matter.total_price)}</span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-2">
                          <span className="rounded border border-white/10 bg-white/[0.02] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-white/45">
                            {stateLabel(matter.canonical_state)}
                          </span>
                          <span className="rounded border border-white/10 bg-white/[0.02] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-white/35">
                            {matter.payment_status.replaceAll("_", " ")}
                          </span>
                          {matter.alias_applied ? (
                            <span className="rounded border border-amber-400/15 bg-amber-400/[0.04] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-amber-200/55">
                              legacy projected
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
