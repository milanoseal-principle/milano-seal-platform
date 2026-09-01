import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const GOLD = "#C6A55A";
const GOLD_DIM = "rgba(198,165,90,0.48)";
const BORDER = "rgba(198,165,90,0.14)";

type DealRow = {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  document_type: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  currency: string | null;
  payment_confirmed: boolean | null;
  payment_status: string | null;
  settlement_status: string | null;
  scheduled_at: string | null;
  apostille_at: string | null;
  tracking_number: string | null;
  carrier: string | null;
  delivery_status: string | null;
  delivery_timestamp: string | null;
  completed_at: string | null;
  deal_status: string | null;
  status: string | null;
  updated_at: string | null;
};

type ReconciliationState =
  | "closed"
  | "delivered_review"
  | "in_transit"
  | "release_payment_blocked"
  | "apostille_ready"
  | "scheduled_settlement_pending"
  | "payment_pending"
  | "execution_in_progress";

const STATE_META: Record<
  ReconciliationState,
  { label: string; tone: string; bg: string; border: string }
> = {
  closed: {
    label: "Closed",
    tone: "rgba(74,222,128,0.82)",
    bg: "rgba(74,222,128,0.045)",
    border: "rgba(74,222,128,0.16)",
  },
  delivered_review: {
    label: "Delivered · close review",
    tone: "rgba(96,165,250,0.82)",
    bg: "rgba(96,165,250,0.045)",
    border: "rgba(96,165,250,0.16)",
  },
  in_transit: {
    label: "Courier in progress",
    tone: "rgba(96,165,250,0.82)",
    bg: "rgba(96,165,250,0.045)",
    border: "rgba(96,165,250,0.16)",
  },
  release_payment_blocked: {
    label: "Final release blocked · settlement required",
    tone: "rgba(248,113,113,0.88)",
    bg: "rgba(248,113,113,0.05)",
    border: "rgba(248,113,113,0.18)",
  },
  apostille_ready: {
    label: "Apostille complete · release review",
    tone: "rgba(196,181,253,0.88)",
    bg: "rgba(139,92,246,0.045)",
    border: "rgba(139,92,246,0.17)",
  },
  scheduled_settlement_pending: {
    label: "Scheduled · Wise settlement pending",
    tone: "rgba(250,204,21,0.82)",
    bg: "rgba(250,204,21,0.04)",
    border: "rgba(250,204,21,0.16)",
  },
  payment_pending: {
    label: "Payment action pending",
    tone: "rgba(251,146,60,0.84)",
    bg: "rgba(251,146,60,0.04)",
    border: "rgba(251,146,60,0.16)",
  },
  execution_in_progress: {
    label: "Execution in progress",
    tone: "rgba(255,255,255,0.52)",
    bg: "rgba(255,255,255,0.025)",
    border: "rgba(255,255,255,0.09)",
  },
};

function normalized(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function classify(row: DealRow): ReconciliationState {
  if (row.completed_at) return "closed";

  const delivery = normalized(row.delivery_status);
  if (row.delivery_timestamp || delivery === "delivered") return "delivered_review";
  if (row.tracking_number || ["label_created", "in_transit", "out_for_delivery"].includes(delivery)) {
    return "in_transit";
  }

  if (row.apostille_at && !row.payment_confirmed) return "release_payment_blocked";
  if (row.apostille_at) return "apostille_ready";

  if (
    row.scheduled_at &&
    !row.payment_confirmed &&
    ["observed_pending", "processing", "pending"].includes(normalized(row.settlement_status))
  ) {
    return "scheduled_settlement_pending";
  }

  if (!row.payment_confirmed && ["unpaid", "pending", ""].includes(normalized(row.payment_status))) {
    return "payment_pending";
  }

  return "execution_in_progress";
}

function money(value: number | null, currency: string | null) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function TruthCell({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
      <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/28">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        {ok === true && <CheckCircle2 className="h-3 w-3 text-emerald-300/75" />}
        {ok === false && <Clock3 className="h-3 w-3 text-amber-300/70" />}
        <p className="truncate text-[11px] text-white/62">{value}</p>
      </div>
    </div>
  );
}

export default async function ReconciliationPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, deal_id, client_name, document_type, amount_due, amount_paid, currency, payment_confirmed, payment_status, settlement_status, scheduled_at, apostille_at, tracking_number, carrier, delivery_status, delivery_timestamp, completed_at, deal_status, status, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  const records = (data ?? []) as DealRow[];
  const unresolved = records.filter((row) => classify(row) !== "closed").length;

  return (
    <div className="space-y-5 text-[#E8E4DC]">
      <Link
        href="/dashboard/matter-intelligence"
        className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] transition-opacity hover:opacity-75"
        style={{ color: GOLD_DIM }}
      >
        <ArrowLeft className="h-3 w-3" /> Matter Intelligence
      </Link>

      <header className="relative overflow-hidden rounded-3xl border p-5 sm:p-7" style={{ borderColor: BORDER, background: "linear-gradient(145deg,rgba(198,165,90,0.08),rgba(0,0,0,0.42) 48%,rgba(255,255,255,0.025))" }}>
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#C6A55A]/[0.055] blur-3xl" />
        <div className="relative">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em]" style={{ color: GOLD_DIM }}>
            Live Matter Truth · Supabase
          </p>
          <h1 className="mt-2 font-serif text-2xl text-[#F4E5B8] sm:text-3xl">
            Payment / Courier Reconciliation
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/42">
            One live view of Wise settlement, scheduling, apostille progression, courier custody, delivery, and close posture. No seeded records and no simulated provider state.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <TruthCell label="Loaded Matters" value={String(records.length)} ok={true} />
            <TruthCell label="Open / Review" value={String(unresolved)} ok={unresolved === 0} />
            <TruthCell label="Authority" value="Supabase deals" ok={true} />
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.045] p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300/80" />
          <div>
            <p className="text-sm font-medium text-red-200/90">Live reconciliation unavailable</p>
            <p className="mt-1 text-xs leading-5 text-white/38">
              The database projection failed. No fallback or demo records are shown. Resolve the source error before using this surface for operational decisions.
            </p>
          </div>
        </div>
      )}

      {!error && records.length === 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 text-center">
          <ShieldCheck className="mx-auto h-6 w-6 text-[#C6A55A]/55" />
          <p className="mt-3 text-sm text-white/62">No Matters returned from the live reconciliation projection.</p>
          <p className="mt-1 text-xs text-white/30">No placeholder records are substituted.</p>
        </div>
      )}

      <div className="space-y-3">
        {records.map((row) => {
          const state = classify(row);
          const meta = STATE_META[state];
          const paymentConfirmed = row.payment_confirmed === true;
          const delivered = Boolean(row.delivery_timestamp) || normalized(row.delivery_status) === "delivered";

          return (
            <article
              key={row.id}
              className="overflow-hidden rounded-2xl border p-4 sm:p-5"
              style={{ borderColor: meta.border, background: meta.bg }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
                    <p className="truncate font-mono text-[11px] tracking-[0.08em] text-[#E7CE8A]">
                      {row.deal_id || row.id}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-xs text-white/38">
                    {row.client_name || "Client not recorded"} · {row.document_type || "Document type not recorded"}
                  </p>
                </div>

                <span
                  className="self-start rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.13em]"
                  style={{ color: meta.tone, borderColor: meta.border, background: meta.bg }}
                >
                  {meta.label}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <TruthCell
                  label="Wise / Payment"
                  value={paymentConfirmed ? `Verified · ${money(row.amount_paid, row.currency)}` : `${row.payment_status || "unpaid"} · ${row.settlement_status || "settlement pending"}`}
                  ok={paymentConfirmed}
                />
                <TruthCell
                  label="Required Balance"
                  value={`${money(row.amount_paid, row.currency)} paid / ${money(row.amount_due, row.currency)} due`}
                />
                <TruthCell
                  label="Scheduling"
                  value={row.scheduled_at ? formatDate(row.scheduled_at) : "Not scheduled"}
                  ok={Boolean(row.scheduled_at)}
                />
                <TruthCell
                  label="Apostille"
                  value={row.apostille_at ? formatDate(row.apostille_at) : "Not completed"}
                  ok={Boolean(row.apostille_at)}
                />
                <TruthCell
                  label="Courier"
                  value={row.tracking_number ? `${row.carrier || "Carrier"} · ${row.tracking_number}` : "No tracking number"}
                  ok={Boolean(row.tracking_number)}
                />
                <TruthCell
                  label="Delivery"
                  value={delivered ? formatDate(row.delivery_timestamp) : row.delivery_status || "Not delivered"}
                  ok={delivered}
                />
                <TruthCell
                  label="Matter Status"
                  value={row.deal_status || row.status || "Not recorded"}
                />
                <TruthCell
                  label="Last Source Update"
                  value={formatDate(row.updated_at)}
                />
              </div>

              {state === "scheduled_settlement_pending" && (
                <div className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.035] px-3 py-2.5 text-xs leading-5 text-amber-100/60">
                  Scheduling is already in motion while Wise settlement remains pending. This is not treated as a duplicate-payment error. Final settlement-dependent release remains independently gated.
                </div>
              )}

              {state === "release_payment_blocked" && (
                <div className="mt-3 rounded-xl border border-red-300/15 bg-red-300/[0.035] px-3 py-2.5 text-xs leading-5 text-red-100/60">
                  Apostille progression is recorded, but final international release must remain blocked until the required Wise balance has authoritative settlement evidence.
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
