"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  CalendarClock,
  Stamp,
  Package,
  ShieldAlert,
  DollarSign,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MilanoSealEntryRitual } from "@/components/dashboard/entry-ritual";

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
  reviewing_count: number;
  scheduled_count: number;
  apostille_count: number;
  shipped_count: number;
  confirmed_payments: number;
  pending_payments: number;
  failed_payments: number;
  balance_due: number;
  security_events_count: number;
  security_events: {
    id: string;
    event: string;
    actor: string | null;
    resource: string | null;
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

function formatEventLabel(event: string): string {
  if (event === "resource.access.denied") return "Access Denied";
  if (event === "resource.download") return "File Download";
  if (event === "resource.signed_url_generated") return "Signed URL Generated";
  if (event === "resource.view") return "Resource View";
  const words = event.replace(/\./g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  const [entryComplete, setEntryComplete] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("ms-operator-entry")) {
      setEntryComplete(true);
    }
  }, []);

  function handleEntryComplete() {
    sessionStorage.setItem("ms-operator-entry", "1");
    setEntryComplete(true);
  }

  const { data, isLoading, isError } = useApi<DashboardSummary>(
    "/api/dashboard/summary",
  );

  if (isLoading)
    return (
      <>
        <AnimatePresence mode="wait">
          {!entryComplete && (
            <MilanoSealEntryRitual onComplete={handleEntryComplete} />
          )}
        </AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: entryComplete ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-gold">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-3 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 bg-card border-gold">
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 rounded-md border border-border"
                >
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-gold">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 pb-3 border-b border-border last:border-0"
                >
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card border-gold">
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-gold">
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between"
                >
                  <Skeleton className="h-4 w-28" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-1.5 w-32 rounded-full" />
                    <Skeleton className="h-4 w-6" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-gold">
          <CardHeader>
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-gold">
          <CardHeader>
            <Skeleton className="h-6 w-52" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-96" />
          </CardContent>
        </Card>
      </div>
        </motion.div>
      </>
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
    <>
      <AnimatePresence mode="wait">
        {!entryComplete && (
          <MilanoSealEntryRitual onComplete={handleEntryComplete} />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: entryComplete ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-2">
            Sovereign Execution Core
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

      {/* Status strip — 6 cards */}
      <motion.div
        className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        initial="hidden"
        animate={entryComplete ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        <motion.div variants={cardVariants}>
          <Stat
            label="Matters in Review"
            value={String(data.reviewing_count)}
            hint="Intake & review"
            icon={FileText}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <Stat
            label="Awaiting Payment"
            value={String(data.awaiting_payment)}
            hint="Gated until cleared"
            icon={Clock}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <Stat
            label="Scheduled Execution"
            value={String(data.scheduled_count)}
            hint="Confirmed & queued"
            icon={CalendarClock}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <Stat
            label="Apostille / Authentication"
            value={String(data.apostille_count)}
            hint="In authentication"
            icon={Stamp}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <Stat
            label="Ready for Release"
            value={String(data.shipped_count)}
            hint="Pending delivery"
            icon={Package}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <Stat
            label="Security Events"
            value={String(data.security_events_count)}
            hint="Recent audit entries"
            icon={ShieldAlert}
          />
        </motion.div>
      </motion.div>

      {/* Recent Matters + Activity */}
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
          <CardContent>
            {data.recent_deals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No matters yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.recent_deals.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dashboard/deals/${d.deal_id ?? d.id}`}
                  >
                    <div
                      data-testid={`recent-deal-${d.deal_id ?? d.id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-md border border-border hover-elevate cursor-pointer"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="font-mono text-xs text-gold">
                          {d.deal_id ?? `${d.id.slice(0, 8)}…`}
                        </span>
                        <span className="text-sm text-foreground truncate">
                          {d.client_name ?? "—"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {d.document_type} → {d.destination_country}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-gold">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold" /> Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 overflow-hidden">
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
                  <div className="flex flex-wrap items-center gap-1.5 text-sm min-w-0">
                    <span className="text-foreground truncate">{a.action}</span>
                    {a.deal_id ? (
                      <Link href={`/dashboard/deals/${a.deal_id}`}>
                        <span className="font-mono text-[11px] text-gold hover:underline cursor-pointer truncate max-w-[140px] inline-block">
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

      {/* Finance Snapshot + Destinations */}
      <motion.div
        className="grid gap-6 md:grid-cols-2"
        initial="hidden"
        animate={entryComplete ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.48 } },
        }}
      >
        <motion.div variants={cardVariants}>
        <Card className="bg-card border-gold">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gold" /> Finance Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Confirmed Payments</span>
              <span className="text-foreground">{data.confirmed_payments}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pending Payments</span>
              <span className="text-foreground">{data.pending_payments}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Failed Payments</span>
              <span className="text-foreground">{data.failed_payments}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance Due</span>
              <span className="text-gold">{formatCurrency(data.balance_due)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pipeline Value</span>
              <span className="text-gold">{formatCurrency(data.revenue_pipeline)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Revenue Collected</span>
              <span className="text-foreground">{formatCurrency(data.revenue_closed)}</span>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
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
        </motion.div>
      </motion.div>

      {/* Audit Ledger */}
      <Card className="bg-card border-gold">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-gold" /> Audit Ledger
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.security_events.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No security events recorded.
            </p>
          ) : (
            <div>
              {data.security_events.slice(0, 8).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0 text-sm"
                >
                  <span className="text-foreground font-medium">
                    {formatEventLabel(e.event)}
                  </span>
                  <span className="text-muted-foreground truncate max-w-[120px]">
                    {e.actor ?? "—"}
                  </span>
                  <span className="text-muted-foreground truncate max-w-[160px]">
                    {e.resource ?? "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70 shrink-0">
                    {timeAgo(e.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Custody */}
      <Card className="bg-card border-gold">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Package className="w-4 h-4 text-gold" /> Document Custody — Chain-of-Custody
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Open a matter from the Execution Queue to view its chain-of-custody timeline.
          </p>
          <Link href="/dashboard/deals">
            <Button
              variant="outline"
              size="sm"
              className="border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft text-xs"
            >
              Open Execution Queue
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Service Lanes */}
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
      </motion.div>
    </>
  );
}
