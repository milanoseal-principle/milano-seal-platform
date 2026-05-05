"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, stageLabel, stageTone } from "@/lib/format";

interface PipelineDeal {
  deal_id: string;
  client_name: string;
  document_type: string;
  destination_country: string;
  lane: string;
  total_price: number;
}

interface PipelineSummary {
  stages: {
    stage: string;
    count: number;
    total_value: number;
    deals: PipelineDeal[];
  }[];
  total_open: number;
  total_value_open: number;
  total_value_closed: number;
}

export default function Pipeline() {
  const { data, isLoading } = useApi<PipelineSummary>("/api/admin/pipeline");

  if (isLoading)
    return <div className="text-muted-foreground">Loading pipeline…</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-2">
          Pipeline
        </p>
        <h1 className="font-serif text-4xl text-foreground">
          Execution Pipeline
        </h1>
        <p className="text-muted-foreground mt-2">
          {data.total_open} open matters ·{" "}
          {formatCurrency(data.total_value_open)} pipeline ·{" "}
          {formatCurrency(data.total_value_closed)} closed
        </p>
      </div>

      <div className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] gap-4 overflow-x-auto pb-4">
        {data.stages.map((s) => (
          <Card
            key={s.stage}
            className="bg-card border-gold min-h-[400px] flex flex-col"
          >
            <CardHeader className="pb-3 sticky top-0 bg-card z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium uppercase tracking-widest">
                  {stageLabel(s.stage)}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    stageTone(s.stage) === "paid"
                      ? "bg-paid"
                      : stageTone(s.stage) === "critical"
                      ? "bg-critical"
                      : "bg-await"
                  }
                >
                  {s.count}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(s.total_value)}
              </p>
              <div className="gold-rule mt-2" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 pt-3">
              {s.deals.length === 0 ? (
                <div className="text-xs text-muted-foreground/60 italic py-4 text-center">
                  Empty
                </div>
              ) : (
                s.deals.map((d) => (
                  <Link key={d.deal_id} href={`/dashboard/deals/${d.deal_id}`}>
                    <div
                      data-testid={`pipeline-card-${d.deal_id}`}
                      className="p-3 rounded-lg border border-border/80 bg-card shadow-sm hover:border-gold/40 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-gold">
                          {d.deal_id}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {d.lane}
                        </span>
                      </div>
                      <div className="text-sm text-foreground truncate">
                        {d.client_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {d.document_type}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-foreground/80">
                          {d.destination_country}
                        </span>
                        <span className="text-xs font-medium text-gold">
                          {formatCurrency(d.total_price)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
