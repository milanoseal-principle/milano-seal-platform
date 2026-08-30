export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import {
  operationalClientName,
  operationalDestinationCountry,
  operationalDocumentType,
  operationalMatterDisplayId,
  resolveOperationalMatterState,
  stateLabel,
  type OperationalMatterSourceRow,
} from "@/lib/matter/canonicalOperationalRead";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Apostille Authentication Desk — Milano Seal",
};

interface PageProps {
  searchParams: Promise<{
    matter?: string;
    deal?: string;
    focus?: string;
  }>;
}

interface ApostilleMatter extends OperationalMatterSourceRow {
  id: string;
  deal_id?: string | null;
  apostille_required?: boolean | null;
  requires_apostille?: boolean | null;
}

const APOSTILLE_RELATED_STATES = new Set([
  "apostille_packet_ready",
  "apostille_submitted",
  "apostille_processing",
  "apostille_received",
  "apostille_rejected",
  "final_balance_due",
  "final_payment_pending_review",
  "final_payment_confirmed",
  "ready_for_release",
  "final_packet_assembled",
  "label_created",
  "in_transit",
  "customs_watch",
  "out_for_delivery",
  "delivered",
  "completed",
]);

const SUBMITTED_STATES = new Set(["apostille_submitted", "apostille_processing"]);

const RECEIVED_OR_LATER_STATES = new Set([
  "apostille_received",
  "final_balance_due",
  "final_payment_pending_review",
  "final_payment_confirmed",
  "ready_for_release",
  "final_packet_assembled",
  "label_created",
  "in_transit",
  "customs_watch",
  "out_for_delivery",
  "delivered",
  "completed",
]);

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function statusMeta(state: string | null) {
  if (state === "apostille_rejected") return { label: "Exception", className: "border-red-500/25 bg-red-500/[0.06] text-red-300" };
  if (state && RECEIVED_OR_LATER_STATES.has(state)) return { label: "Authenticated", className: "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300/90" };
  if (state && SUBMITTED_STATES.has(state)) return { label: "Submitted", className: "border-[#C6A65B]/25 bg-[#C6A65B]/[0.05] text-[#E4CA8C]" };
  return { label: "Review", className: "border-amber-400/20 bg-amber-400/[0.05] text-amber-200/80" };
}

function actionCopy(state: string | null) {
  if (state === "apostille_rejected") return "Resolve the apostille exception before the Matter can advance.";
  if (state === "apostille_packet_ready") return "Confirm packet readiness and submit through the governed apostille workflow.";
  if (state && SUBMITTED_STATES.has(state)) return "Monitor authority processing. Do not advance until receipt is recorded.";
  if (state && RECEIVED_OR_LATER_STATES.has(state)) return "Authentication evidence is present. Continue through the canonical payment/release stage.";
  return "Review jurisdiction, document and authority requirements before submission.";
}

function nextEventCopy(state: string | null) {
  if (state === "apostille_rejected") return "Corrected packet or operator review.";
  if (state === "apostille_packet_ready") return "Apostille submission recorded.";
  if (state === "apostille_submitted" || state === "apostille_processing") return "Apostille received from issuing authority.";
  if (state === "apostille_received") return "Final payment/release readiness review.";
  if (state && RECEIVED_OR_LATER_STATES.has(state)) return "Release, courier or completion event on the same Matter.";
  return "Operator authentication review.";
}

export default async function ApostillePage({ searchParams }: PageProps) {
  await requireDashboardAccess();
  const params = await searchParams;
  const focusMatter = params.matter?.trim() || params.deal?.trim() || null;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("deals")
    .select("id, deal_id, client_name, full_name, destination_country, country, document_type, document, service_type, status, deal_status, apostille_required, requires_apostille, apostille_at, scheduled_at, created_at, updated_at, due_at, sla_deadline")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) console.error("[apostille] canonical read failed:", error.message);

  const matters = ((data ?? []) as ApostilleMatter[])
    .map((row) => ({ row, state: resolveOperationalMatterState(row).state }))
    .filter(({ row, state }) => row.apostille_required === true || row.requires_apostille === true || Boolean(state && APOSTILLE_RELATED_STATES.has(state)));

  const counts = {
    pending: matters.filter(({ state }) => !state || (!SUBMITTED_STATES.has(state) && !RECEIVED_OR_LATER_STATES.has(state) && state !== "apostille_rejected")).length,
    submitted: matters.filter(({ state }) => state && SUBMITTED_STATES.has(state)).length,
    exceptions: matters.filter(({ state }) => state === "apostille_rejected").length,
    received: matters.filter(({ state }) => state && RECEIVED_OR_LATER_STATES.has(state)).length,
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-4 py-5 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-2xl border border-[#C6A65B]/20 bg-[radial-gradient(circle_at_85%_0%,rgba(198,166,91,0.12),transparent_34%),linear-gradient(135deg,#070707,#0b0b0b)] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.36)] sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A65B]/60">Authentication / Apostille Authority</p>
            <h1 className="mt-2 font-serif text-3xl text-[#F6F1E6]">Apostille Authentication Desk</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Canonical Matter state projected into a clear authentication queue. Historical compatibility labels remain read-only and this surface never invents authority completion.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {focusMatter ? <Link href="/dashboard/apostille" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55 hover:border-[#C6A65B]/30">Clear Focus</Link> : null}
            <Link href="/today" className="flex min-h-11 items-center rounded-xl border border-[#C6A65B]/20 bg-[#C6A65B]/[0.04] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#E4CA8C]/80 hover:border-[#C6A65B]/40">Back to Today</Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[["Review", counts.pending], ["Submitted", counts.submitted], ["Exceptions", counts.exceptions], ["Authenticated", counts.received]].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">{label}</p>
              <p className="mt-1 text-xl font-light text-[#E4CA8C]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-red-300/70">Apostille Data Unavailable</p>
          <p className="mt-2 text-xs leading-5 text-white/45">Production Matter data could not be read. This is not an empty tracker.</p>
        </section>
      ) : matters.length === 0 ? (
        <section className="rounded-2xl border border-white/[0.07] bg-[#090909] px-5 py-16 text-center"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">No apostille-related Matters</p></section>
      ) : (
        <>
          <section className="grid gap-4 md:hidden">
            {matters.map(({ row, state }) => {
              const displayId = operationalMatterDisplayId(row);
              const focused = focusMatter === row.id || focusMatter === displayId;
              const meta = statusMeta(state);
              return (
                <article key={row.id} className={`rounded-2xl border bg-[#090909] p-4 ${focused ? "border-[#C6A65B]/55 shadow-[0_0_35px_rgba(198,166,91,0.1)]" : "border-white/[0.07]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#C6A65B]/55">{displayId}</p>
                      <h2 className="mt-1 truncate text-sm font-semibold text-white/85">{operationalClientName(row)}</h2>
                      <p className="mt-1 text-xs text-white/35">{operationalDocumentType(row) ?? "Document unresolved"} · {operationalDestinationCountry(row) ?? "Destination unresolved"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] ${meta.className}`}>{meta.label}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"><p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/25">Current Stage</p><p className="mt-1 text-xs capitalize text-white/60">{stateLabel(state)}</p></div>
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"><p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/25">Submitted</p><p className="mt-1 text-xs text-white/60">{formatDate(row.apostille_at)}</p></div>
                  </div>

                  <div className="mt-3 rounded-xl border border-[#C6A65B]/12 bg-[#C6A65B]/[0.025] p-3"><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#C6A65B]/55">Action Required</p><p className="mt-1 text-xs leading-5 text-white/50">{actionCopy(state)}</p></div>
                  <div className="mt-3"><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">Next Expected Event</p><p className="mt-1 text-xs leading-5 text-white/45">{nextEventCopy(state)}</p></div>

                  <Link href={`/dashboard/deals/${encodeURIComponent(row.id)}`} className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl border border-[#C6A65B]/25 bg-[#C6A65B]/[0.055] px-4 py-2 text-xs font-semibold text-[#E4CA8C] hover:border-[#C6A65B]/45">Open Matter Authentication →</Link>
                </article>
              );
            })}
          </section>

          <section className="hidden overflow-hidden rounded-2xl border border-white/[0.07] bg-[#090909] md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead><tr className="border-b border-white/[0.06]">{["Matter", "Client", "Destination", "Document", "Canonical State", "Submitted", "Scheduled", "Apostille Status"].map((header) => <th key={header} className="px-4 py-3 font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-[#C6A65B]/45">{header}</th>)}</tr></thead>
                <tbody>
                  {matters.map(({ row, state }) => {
                    const displayId = operationalMatterDisplayId(row);
                    const focused = focusMatter === row.id || focusMatter === displayId;
                    const meta = statusMeta(state);
                    return (
                      <tr key={row.id} className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.015] ${focused ? "bg-[#C6A65B]/[0.05]" : ""}`}>
                        <td className="px-4 py-3"><Link href={`/dashboard/deals/${encodeURIComponent(row.id)}`} className="font-mono text-[10px] text-[#E4CA8C] hover:underline">{displayId}</Link></td>
                        <td className="px-4 py-3 text-xs text-white/65">{operationalClientName(row)}</td>
                        <td className="px-4 py-3 text-xs text-white/50">{operationalDestinationCountry(row) ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-white/45">{operationalDocumentType(row) ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-[10px] capitalize text-white/45">{stateLabel(state)}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-white/35">{formatDate(row.apostille_at)}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-white/35">{formatDate(row.scheduled_at)}</td>
                        <td className="px-4 py-3"><span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] ${meta.className}`}>{meta.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
