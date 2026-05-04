"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, stageLabel, stageTone, timeAgo } from "@/lib/format";
import {
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Globe2,
  Activity,
} from "lucide-react";

interface DashboardSummary {
  total_deals: number;
  open_deals: number;
  closed_deals: number;
  revenue_closed: number;
  revenue_pipeline: number;
  intake_today: number;
  intake_week: number;
  avg_deal_value: number;
  awaiting_payment: number;
  in_execution: number;
  countries: { country: string; count: number }[];
  lanes: { lane: string; count: number }[];
  recent_deals: {
    id: string;
    deal_id: string | null;
    client_name: string | null;
    document_type: string;
    destination_country: string;
    total_price: number;
    deal_status: string;
  }[];
  recent_activity: {
    id: string;
    deal_id: string | null;
    action: string;
    detail: string | null;
    created_at: string;
  }[];
}

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Briefcase;
}) {
  return (
    <Card className="bg-card border-gold">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-gold" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-serif text-foreground">{value}</div>
        {hint ? (
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError } = useApi<DashboardSummary>(
    "/api/dashboard/summary"
  );

  if (isLoading)
    return (
      <div className="text-muted-foreground">Loading command surface…</div>
    );
  if (isError || !data)
    return (
      <div className="text-destructive">Failed to load dashboard summary.</div>
    );

  const maxCountry =
    data.countries.length > 0
      ? Math.max(...data.countries.map((x) => x.count))
      : 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-2">
            Operator Command Surface
          </p>
          <h1 className="font-serif text-4xl text-foreground">
            Today at the Seal
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Live snapshot of every matter in the international execution
            pipeline — intake to apostille to delivery.
          </p>
        </div>
        <Link href="/dashboard/intake">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gold-glow">
            New Matter Intake <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Open Matters"
          value={String(data.open_deals)}
          hint="Active in pipeline"
          icon={Briefcase}
        />
        <Stat
          label="Pipeline Value"
          value={formatCurrency(data.revenue_pipeline)}
          hint={`Avg ${formatCurrency(data.avg_deal_value)} / matter`}
          icon={TrendingUp}
        />
        <Stat
          label="Awaiting Payment"
          value={String(data.awaiting_payment)}
          hint="Gated until cleared"
          icon={Clock}
        />
        <Stat
          label="Closed (revenue)"
          value={formatCurrency(data.revenue_closed)}
          hint={`${data.closed_deals} matters delivered`}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-card border-gold">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-xl">Recent Matters</CardTitle>
            <Link href="/dashboard/deals">
              <Button
                variant="ghost"
                size="sm"
                className="text-gold hover:text-gold hover:bg-gold-soft"
              >
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recent_deals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No matters yet.</p>
            ) : (
              data.recent_deals.map((d) => (
                <Link key={d.id} href={`/dashboard/deals/${d.deal_id ?? d.id}`}>
                  <div
                    data-testid={`recent-deal-${d.deal_id ?? d.id}`}
                    className="flex items-center justify-between p-3 rounded-md border border-border hover-elevate cursor-pointer"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gold">
                          {d.deal_id ?? `${d.id.slice(0, 8)}…`}
                        </span>
                        <span className="text-foreground truncate">
                          {d.client_name ?? "—"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {d.document_type} → {d.destination_country}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-foreground">
                        {formatCurrency(d.total_price)}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          stageTone(d.deal_status) === "paid"
                            ? "bg-paid"
                            : stageTone(d.deal_status) === "critical"
                            ? "bg-critical"
                            : "bg-await"
                        }
                      >
                        {stageLabel(d.deal_status)}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-gold">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold" /> Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent_activity.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No activity recorded.
              </p>
            ) : (
              data.recent_activity.slice(0, 8).map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-0.5 pb-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-foreground">{a.action}</span>
                    {a.deal_id ? (
                      <Link href={`/dashboard/deals/${a.deal_id}`}>
                        <span className="font-mono text-[11px] text-gold hover:underline cursor-pointer">
                          {a.deal_id}
                        </span>
                      </Link>
                    ) : null}
                  </div>
                  {a.detail ? (
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {a.detail}
                    </span>
                  ) : null}
                  <span className="text-[10px] text-muted-foreground/70">
                    {timeAgo(a.created_at)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-gold">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-gold" /> Destinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.countries.slice(0, 8).map((c) => (
                <div
                  key={c.country}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{c.country}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(c.count / maxCountry) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground w-6 text-right">
                      {c.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gold">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Service Lanes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.lanes.map((l) => (
                <div
                  key={l.lane}
                  className="flex items-center justify-between p-2 border border-border rounded"
                >
                  <span className="text-foreground">{l.lane}</span>
                  <Badge
                    variant="outline"
                    className="bg-gold-soft border-gold text-gold"
                  >
                    {l.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
