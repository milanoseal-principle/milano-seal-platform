<<<<<<< HEAD
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

interface RevenueItem {
  id: string;
  display_id?: string;
  deal_status?: string;
  created_at?: string;
  destination_country?: string;
  amount_due?: number;
  amount_paid?: number;
  last_contact_at?: string;
  completed_at?: string;
  lost_reason?: string;
}

interface RevenuePipeline {
  new_intake: RevenueItem[];
  quote_needed: RevenueItem[];
  invoice_sent: RevenueItem[];
  payment_pending: RevenueItem[];
  follow_up_due: RevenueItem[];
  closed_won: RevenueItem[];
  closed_lost: RevenueItem[];
}

interface RevenueData {
  pipeline: RevenuePipeline;
  totals: {
    pipeline_value: number;
    collected: number;
    won_this_month: number;
    lost_this_month: number;
  };
}

async function fetchRevenue(): Promise<RevenueData | null> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/dashboard/revenue`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const STAGE_LABELS: Record<string, string> = {
  new_intake: "New Intake",
  quote_needed: "Quote Needed",
  invoice_sent: "Invoice Sent",
  payment_pending: "Payment Pending",
  follow_up_due: "Follow-Up Due",
  closed_won: "Closed — Won",
  closed_lost: "Closed — Lost",
};

function MetricChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "gold" | "green" | "red" | "amber";
}) {
  const color =
    accent === "green"
      ? "text-emerald-400 border-emerald-600/30 bg-emerald-950/20"
      : accent === "red"
        ? "text-red-400 border-red-600/30 bg-red-950/20"
        : accent === "amber"
          ? "text-amber-400 border-amber-600/30 bg-amber-950/20"
          : "text-[rgba(198,165,90,0.9)] border-[rgba(198,165,90,0.2)] bg-[rgba(198,165,90,0.06)]";

  return (
    <div
      className={`flex flex-col gap-1 px-5 py-3 rounded-md border ${color}`}
    >
      <span className="text-[10px] uppercase tracking-widest font-mono opacity-70">
        {label}
      </span>
      <span className="font-serif text-2xl">{value}</span>
    </div>
  );
}

function StageSection({
  stageKey,
  items,
  highlight,
}: {
  stageKey: string;
  items: RevenueItem[];
  highlight?: boolean;
}) {
  const label = STAGE_LABELS[stageKey] ?? stageKey;

  return (
    <div
      className={`border rounded-md overflow-hidden ${
        highlight
          ? "border-amber-600/40"
          : "border-[rgba(198,165,90,0.12)]"
      }`}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 ${
          highlight ? "bg-amber-950/20" : "bg-[#0a0a0c]"
        }`}
      >
        <span
          className={`font-mono text-xs uppercase tracking-widest ${
            highlight ? "text-amber-400" : "text-[rgba(198,165,90,0.75)]"
          }`}
        >
          {label}
        </span>
        <span
          className={`font-mono text-xs px-2 py-0.5 rounded ${
            highlight
              ? "bg-amber-950/60 border border-amber-600/40 text-amber-400"
              : "bg-[rgba(198,165,90,0.12)] border border-[rgba(198,165,90,0.25)] text-[rgba(198,165,90,0.8)]"
          }`}
        >
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-3 bg-[#060608]">
          <p className="text-xs text-muted-foreground font-mono">No items in this stage.</p>
        </div>
      ) : (
        <div className="bg-[#060608] divide-y divide-[rgba(198,165,90,0.06)]">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-mono text-[11px] text-[rgba(198,165,90,0.8)]">
                  {item.display_id ?? item.id?.slice(0, 8) ?? "—"}
                </span>
                {item.destination_country && (
                  <span className="text-xs text-muted-foreground">
                    {item.destination_country}
                  </span>
                )}
                {item.amount_due != null && (
                  <span className="text-xs text-muted-foreground">
                    Due: {formatCurrency(item.amount_due)}
                    {item.amount_paid != null && item.amount_paid > 0
                      ? ` · Paid: ${formatCurrency(item.amount_paid)}`
                      : ""}
                  </span>
                )}
                {item.amount_paid != null &&
                  item.amount_due == null && (
                    <span className="text-xs text-muted-foreground">
                      Collected: {formatCurrency(item.amount_paid)}
                    </span>
                  )}
                {item.lost_reason && (
                  <span className="text-xs text-muted-foreground italic">
                    {item.lost_reason}
                  </span>
                )}
                {item.last_contact_at && (
                  <span className="text-xs text-amber-400/70">
                    Last contact: {new Date(item.last_contact_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <Link
                href={`/dashboard/deals/${item.display_id ?? item.id}`}
                className="text-xs font-mono text-[rgba(198,165,90,0.5)] hover:text-[rgba(198,165,90,1)] whitespace-nowrap shrink-0"
              >
                View →
              </Link>
=======
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Revenue Close Desk | The Milano Seal™",
  robots: { index: false, follow: false },
};

const ADMIN_ROLES = new Set(["admin", "operator", "superadmin", "founder_admin", "admin_operator", "ops_manager"]);

const STAGES = [
  { id: "new_intake", label: "New Intake", status: ["new", "intake_review"] },
  { id: "quote_needed", label: "Quote Needed", status: ["quote_needed"] },
  { id: "invoice_sent", label: "Invoice Sent", status: ["invoice_sent"] },
  { id: "payment_pending", label: "Payment Pending", status: ["awaiting_payment"] },
  { id: "in_progress", label: "In Progress", status: ["open", "scheduled", "in_execution", "apostille", "shipped"] },
  { id: "delivered", label: "Delivered", status: ["delivered"] },
  { id: "closed", label: "Closed", status: ["completed", "released"] },
];

export default async function RevenuePage() {
  const serverClient = await createClient();
  const { data: { user }, error: authError } = await serverClient.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await serverClient.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !ADMIN_ROLES.has(profile.role)) redirect("/dashboard");

  const supabase = createAdminClient();
  const { data: deals } = await supabase
    .from("deals")
    .select("id, deal_status, document_type, destination_country, created_at, client_name")
    .order("created_at", { ascending: false });

  const staged = STAGES.map(stage => ({
    ...stage,
    items: (deals ?? []).filter(d => stage.status.includes(d.deal_status ?? "")),
  }));

  return (
    <div className="min-h-screen p-6" style={{ background: "#060402" }}>
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>Dashboard · Revenue</p>
        <h1 className="font-serif text-2xl text-white tracking-wide">Revenue Close Desk</h1>
      </div>

      {!deals || deals.length === 0 ? (
        <div className="rounded border px-6 py-12 text-center" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
          <p className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No Data Yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {staged.map(stage => (
            <div key={stage.id} className="rounded border p-4" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>{stage.label}</p>
                <span className="font-mono text-[11px] font-bold" style={{ color: stage.items.length > 0 ? "#D4AF37" : "rgba(255,255,255,0.2)" }}>
                  {stage.items.length}
                </span>
              </div>
              <div className="space-y-2">
                {stage.items.slice(0, 5).map(item => (
                  <div key={item.id} className="px-2 py-1.5 rounded" style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.08)" }}>
                    <p className="font-mono text-[10px] truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {item.client_name ?? item.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="font-mono text-[9px]" style={{ color: "rgba(212,175,55,0.4)" }}>
                      {item.document_type ?? "—"} · {item.destination_country ?? "—"}
                    </p>
                  </div>
                ))}
                {stage.items.length > 5 && (
                  <p className="font-mono text-[9px] text-center" style={{ color: "rgba(255,255,255,0.25)" }}>+{stage.items.length - 5} more</p>
                )}
              </div>
>>>>>>> claude/funny-maxwell-hlxQN
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
<<<<<<< HEAD

export default async function RevenuePage() {
  await requireDashboardAccess();
  const data = await fetchRevenue();

  const pipeline: RevenuePipeline = data?.pipeline ?? {
    new_intake: [],
    quote_needed: [],
    invoice_sent: [],
    payment_pending: [],
    follow_up_due: [],
    closed_won: [],
    closed_lost: [],
  };
  const totals = data?.totals ?? {
    pipeline_value: 0,
    collected: 0,
    won_this_month: 0,
    lost_this_month: 0,
  };

  const stageOrder: (keyof RevenuePipeline)[] = [
    "new_intake",
    "quote_needed",
    "invoice_sent",
    "payment_pending",
    "follow_up_due",
    "closed_won",
    "closed_lost",
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[rgba(198,165,90,0.7)] font-medium mb-2">
          Revenue Close Desk
        </p>
        <h1 className="font-serif text-4xl text-foreground">Revenue Pipeline</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Active matters by stage from intake to close.
        </p>
      </div>

      {/* Metric bar */}
      <div className="flex flex-wrap gap-3">
        <MetricChip
          label="Pipeline Value"
          value={formatCurrency(totals.pipeline_value)}
          accent="gold"
        />
        <MetricChip
          label="Collected"
          value={formatCurrency(totals.collected)}
          accent="green"
        />
        <MetricChip
          label="Won This Month"
          value={formatCurrency(totals.won_this_month)}
          accent="green"
        />
        <MetricChip
          label="Lost This Month"
          value={String(totals.lost_this_month)}
          accent="red"
        />
      </div>

      {/* Stages */}
      <div className="space-y-2">
        {stageOrder.map((key) => (
          <StageSection
            key={key}
            stageKey={key}
            items={pipeline[key]}
            highlight={key === "follow_up_due" && pipeline.follow_up_due.length > 0}
          />
        ))}
      </div>
    </div>
  );
}
=======
>>>>>>> claude/funny-maxwell-hlxQN
