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
import { OperatorActionPanel } from "@/components/dashboard/OperatorActionPanel";
import { StatusGlowMatrix } from "@/components/dashboard/status-glow-matrix";
import { LiveEventBusStream } from "@/components/dashboard/LiveEventBusStream";
import { ExecutionOrchestrationPipeline } from "@/components/dashboard/ExecutionOrchestrationPipeline";
import { ChainOfCustodyIntelligence } from "@/components/dashboard/ChainOfCustodyIntelligence";
import { CourierIntelligencePanel } from "@/components/dashboard/CourierIntelligencePanel";
import { GlobalExecutionIntelligence } from "@/components/dashboard/GlobalExecutionIntelligence";
import { DestinationIntelligenceWidget } from "@/components/dashboard/destination-intelligence-widget";
import { CountryHealthMatrix } from "@/components/dashboard/country-health-matrix";
import { OperatorEventTimeline } from "@/components/dashboard/operator-event-timeline";
import { ExecutionPipeline } from "@/components/dashboard/ExecutionPipeline";
import { TrustEngineAlerts } from "@/components/dashboard/TrustEngineAlerts";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { TopCountriesPanel } from "@/components/dashboard/TopCountriesPanel";
import { TopDocumentsPanel } from "@/components/dashboard/TopDocumentsPanel";
import { MattersByStatus } from "@/components/dashboard/MattersByStatus";
import { ExecutionStatusRail } from "@/components/dashboard/ExecutionStatusRail";
import { MatterQueue } from "@/components/dashboard/MatterQueue";
import { QuickActionIntelligenceMenu } from "@/components/dashboard/QuickActionIntelligenceMenu";
import { operatorDashboardModules } from "@/lib/modules/operatorDashboardModules";

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

interface QuickActionSummary {
  summary: {
    actionRequiredCount: number;
    blockedCount: number;
    reviewRequiredCount: number;
    readyCount: number;
    deliveredNotReleasedCount: number;
    vaTaskCount: number;
    overdueVaTaskCount: number;
    no_data: boolean;
  };
  role?: string;
  matterContext?: {
    id?: string;
    matter_ref?: string;
    matter_status?: string;
    payment_status?: string;
    release_status?: string;
    destination_country?: string;
    document_type?: string;
  } | null;
}

interface SlaAlert {
  deal_id: string;
  client_name: string | null;
  deal_status: string;
  hours_in_stage: number;
  sla_hours: number;
  severity: "low" | "medium" | "high";
}

function slaAlertLabel(alert: SlaAlert): string {
  const over = Math.round(alert.hours_in_stage - alert.sla_hours);
  if (over <= 0) return `Within SLA (${Math.round(alert.hours_in_stage)}h / ${alert.sla_hours}h)`;
  return `${over}h over SLA — ${stageLabel(alert.deal_status)}`;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  critical,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Briefcase;
  critical?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", damping: 30, stiffness: 180 }}
    >
      <Card className={`bg-card ${critical ? "border-destructive/60" : "border-gold"}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            {label}
          </CardTitle>
          {critical ? (
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon className="h-4 w-4 text-destructive" />
            </motion.div>
          ) : (
            <Icon className="h-4 w-4 text-gold" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-serif text-foreground">{value}</div>
          {hint ? (
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
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
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

const alertRowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};


export default function Dashboard() {
  const [entryComplete, setEntryComplete] = useState(false);
  const [actionPanelOpen, setActionPanelOpen] = useState(false);
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);

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
  const { data: slaAlerts } = useApi<SlaAlert[]>("/api/admin/sla-alerts");
  const { data: quickActionsData } = useApi<QuickActionSummary>("/api/dashboard/quick-actions");

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
      <div className="space-y-8" role="status" aria-label="Preparing Execution Center…">
        <p className="text-[11px] font-mono tracking-widest" style={{ color: "rgba(198,165,90,0.5)", marginBottom: 8 }}>Preparing Execution Center…</p>
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
      <motion.div
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: entryComplete ? 1 : 0, y: entryComplete ? 0 : -8 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-2">
            THE MILANO SEAL™
          </p>
          <h1 className="font-serif text-4xl text-foreground">
            Command Center
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Internal execution control for intake, payment, scheduling,
            apostille, custody, and release.
          </p>
          <div className="sr-only">
            {operatorDashboardModules.join(",")}
          </div>
        </div>
        <Link href="/dashboard/intake">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gold-glow">
            New Matter Intake <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </motion.div>

      {/* Status strip — 6 cards */}
      <motion.div
        className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        initial="hidden"
        animate={entryComplete ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
        }}
      >
        <motion.div variants={cardVariants}>
          <Stat
            label="Active Matters"
            value={String(data.open_deals)}
            hint="Open in pipeline"
            icon={Briefcase}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <Stat
            label="Awaiting Payment"
            value={String(data.awaiting_payment)}
            hint="Gated until cleared"
            icon={Clock}
            critical={data.awaiting_payment > 0}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <Stat
            label="In Execution"
            value={String(data.in_execution)}
            hint="Being executed now"
            icon={Activity}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <Stat
            label="Revenue Collected"
            value={formatCurrency(data.revenue_closed)}
            hint="Collected this week"
            icon={DollarSign}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <Stat
            label="Pipeline Value"
            value={formatCurrency(data.revenue_pipeline)}
            hint="Open deal value"
            icon={TrendingUp}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <Stat
            label="Completion Rate"
            value={
              (data.confirmed_payments + data.pending_payments + data.failed_payments) > 0
                ? `${Math.round((data.confirmed_payments / (data.confirmed_payments + data.pending_payments + data.failed_payments)) * 100)}%`
                : `${data.closed_deals > 0 ? Math.round((data.closed_deals / Math.max(data.total_deals, 1)) * 100) : 0}%`
            }
            hint="Closed vs total"
            icon={CheckCircle2}
          />
        </motion.div>
      </motion.div>

      {/* Execution Status Rail — live pipeline stage counts */}
      <ExecutionStatusRail />

      {/* SLA Alerts */}
      {slaAlerts && slaAlerts.length > 0 && (
        <motion.div
          className="space-y-2"
          initial="hidden"
          animate={entryComplete ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.55 } } }}
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
            SLA Alerts
          </p>
          {slaAlerts.map((alert) => (
            <motion.div key={alert.deal_id} variants={alertRowVariants}>
              <Link href={`/dashboard/deals/${alert.deal_id}`}>
                <div className={`flex items-center justify-between gap-3 p-3 rounded-md border cursor-pointer hover-elevate ${
                  alert.severity === "high"
                    ? "border-destructive/60 bg-destructive/5"
                    : alert.severity === "medium"
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-border"
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldAlert className={`w-4 h-4 flex-shrink-0 ${
                      alert.severity === "high" ? "text-destructive" : "text-amber-500"
                    }`} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-foreground truncate">{alert.client_name ?? alert.deal_id}</span>
                      <span className="text-xs text-muted-foreground">{slaAlertLabel(alert)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    alert.severity === "high" ? "bg-critical" : "bg-await"
                  }>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Execution Pipeline */}
      <ExecutionOrchestrationPipeline
        counts={{
          reviewing_count: data.reviewing_count,
          awaiting_payment: data.awaiting_payment,
          scheduled_count: data.scheduled_count,
          in_execution: data.in_execution,
          apostille_count: data.apostille_count,
          shipped_count: data.shipped_count,
        }}
        slaEscalation={Boolean(slaAlerts && slaAlerts.length > 0)}
      />

      {/* Pipeline Load Matrix */}
      <StatusGlowMatrix
        counts={{
          reviewing_count: data.reviewing_count,
          awaiting_payment: data.awaiting_payment,
          scheduled_count: data.scheduled_count,
          in_execution: data.in_execution,
          apostille_count: data.apostille_count,
          shipped_count: data.shipped_count,
        }}
      />

      {/* Matter Queue */}
      <Card className="bg-card border-gold">
        <CardContent className="pt-6">
          <MatterQueue onMatterClick={(id) => setSelectedMatterId(id)} />
        </CardContent>
      </Card>

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
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Briefcase className="w-6 h-6 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No matters yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {data.recent_deals.map((d, idx) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05, ease: EASE }}
                  >
                    <Link href={`/dashboard/deals/${d.deal_id ?? d.id}`}>
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
                  </motion.div>
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
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Activity className="w-6 h-6 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No activity recorded.</p>
              </div>
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
            <div className="flex justify-between text-sm border-t border-border pt-2 mt-1">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="text-gold">
                {(data.confirmed_payments + data.pending_payments + data.failed_payments) > 0
                  ? `${Math.round((data.confirmed_payments / (data.confirmed_payments + data.pending_payments + data.failed_payments)) * 100)}%`
                  : "—"}
              </span>
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
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.count / maxCountry) * 100}%` }}
                        transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}
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
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="w-6 h-6 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No security events recorded.</p>
            </div>
          ) : (
            <div>
              {data.security_events.slice(0, 8).map((e) => (
                <motion.div
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0 text-sm rounded-sm px-1 -mx-1"
                  initial={{ backgroundColor: "rgba(198,165,90,0)" }}
                  whileHover={{ backgroundColor: "rgba(198,165,90,0.025)" }}
                  transition={{ duration: 0.15 }}
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
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Event Bus */}
      <LiveEventBusStream />

      {/* Document Custody */}
      <ChainOfCustodyIntelligence />

      {/* Courier Release Intelligence */}
      <CourierIntelligencePanel />

      {/* Global Execution Intelligence */}
      <GlobalExecutionIntelligence />

      {/* Destination Intelligence — per-corridor matter/revenue breakdown */}
      <DestinationIntelligenceWidget />

      {/* Country Health Matrix + Operator Event Timeline — side by side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CountryHealthMatrix />
        <OperatorEventTimeline />

        {/* Execution Pipeline — stage counts */}
        <ExecutionPipeline />

        {/* Matters by Status + Trust Alerts + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MattersByStatus />
          <TrustEngineAlerts />
          <RecentActivityFeed />
        </div>

        {/* Top Countries + Top Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopCountriesPanel />
          <TopDocumentsPanel />
        </div>
      </div>

      {/* Quick Action Intelligence Menu */}
      <Card className="bg-card border-gold overflow-hidden">
        <QuickActionIntelligenceMenu
          isOpen={true}
          onClose={() => {}}
          matterId={selectedMatterId ?? undefined}
        />
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

      {/* Quick Actions FAB — bottom-left, clear of concierge orb */}
      <button
        onClick={() => setActionPanelOpen(true)}
        aria-label="Open operator quick actions"
        style={{
          position: "fixed",
          bottom: 28,
          left: 28,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "linear-gradient(145deg, #1a1408, #0d0a03)",
          border: "1.5px solid rgba(198,165,90,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9000,
          boxShadow: "0 4px 20px rgba(198,165,90,0.2)",
          color: "#C6A55A",
          fontSize: 24,
          fontWeight: 300,
        }}
      >
        +
      </button>

      <OperatorActionPanel
        isOpen={actionPanelOpen}
        onClose={() => setActionPanelOpen(false)}
        role={(quickActionsData?.role as import('@/lib/dashboard/quickActionTypes').QuickActionRole) ?? 'founder_admin'}
        matterId={selectedMatterId ?? undefined}
        matterState={quickActionsData?.matterContext?.matter_status}
        paymentStatus={quickActionsData?.matterContext?.payment_status}
        releaseStatus={quickActionsData?.matterContext?.release_status}
      />
    </>
  );
}
