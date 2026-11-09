export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import {
  operationalClientName,
  operationalDestinationCountry,
  operationalDocumentType,
  operationalMatterDisplayId,
  resolveOperationalMatterState,
  stateLabel,
  type OperationalMatterSourceRow,
} from "@/lib/matter/canonicalOperationalRead";

export const metadata = {
  title: "Scheduling Readiness — The Milano Seal™",
  robots: { index: false, follow: false },
};

type SchedulingMatter = Omit<OperationalMatterSourceRow, "amount_due" | "amount_paid" | "verified_revenue"> & {
  id: string;
  email?: string | null;
  phone?: string | null;
  origin_state?: string | null;
  payment_observed_at?: string | null;
  payment_observed_amount?: number | null;
  payment_observed_currency?: string | null;
  payment_observed_reference?: string | null;
  currency?: string | null;
  wise_reference?: string | null;
  payment_disposition?: string | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  verified_revenue?: number | null;
  comp_authorized?: boolean | null;
  comp_authorization_id?: string | null;
  comp_authorized_at?: string | null;
  comp_revoked_at?: string | null;
};

interface PageProps {
  searchParams: Promise<{ matter?: string; deal?: string }>;
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function truthFor(matter: SchedulingMatter) {
  return (matter.execution_truth ?? {}) as Record<string, unknown>;
}

function operationalBlockers(matter: SchedulingMatter) {
  const truth = truthFor(matter);
  const executionMethod = clean(truth.execution_method)?.toLowerCase();
  const notarizationRequired = truth.notarization_requirement === "required" || executionMethod === "ron";
  const blockers: string[] = [];

  if (!operationalClientName(matter) || operationalClientName(matter) === "Matter") blockers.push("Client identity requires review.");
  if (!matter.email) blockers.push("Client email is required for scheduling communication.");
  if (!matter.phone) blockers.push("Client phone is required for execution coordination.");
  if (!operationalDocumentType(matter)) blockers.push("Document type is unresolved.");
  if (!operationalDestinationCountry(matter)) blockers.push("Destination jurisdiction is unresolved.");

  if (notarizationRequired) {
    const signerLocation = clean(truth.signer_location) ?? clean(matter.origin_state);
    const notaryJurisdiction = clean(truth.notary_jurisdiction);
    const notarialAct = clean(truth.notarial_act)?.toLowerCase();
    if (!signerLocation) blockers.push("Signer location is required for RON readiness.");
    if (!notaryJurisdiction) blockers.push("Notary jurisdiction is required for RON readiness.");
    if (!notarialAct || notarialAct === "unknown" || notarialAct === "review_required") blockers.push("Notarial act requires operator confirmation.");
  }

  return Array.from(new Set(blockers));
}

function paymentMethodLabel(method: ReturnType<typeof evaluateSchedulingGate>["paymentRequirementMethod"]) {
  if (method === "verified_payment") return "Wise verified";
  return "Payment requirement open";
}

function nextEvent(matter: SchedulingMatter, ready: boolean) {
  if (ready) return "Operator may schedule the canonical execution session.";
  const state = resolveOperationalMatterState(matter).state;
  if (state === "awaiting_deposit" || state === "deposit_pending_review") return "Wise payment truth or operational prerequisites must resolve.";
  return "Resolve the listed Matter blockers, then re-check readiness.";
}

export default async function SchedulingReadinessPage({ searchParams }: PageProps) {
  await requireDashboardAccess();
  const params = await searchParams;
  const focusMatter = params.matter?.trim() || params.deal?.trim() || null;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("deals")
    .select("id, deal_id, client_name, full_name, email, phone, destination_country, country, document_type, document, service_type, status, deal_status, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, payment_observed_amount, payment_observed_currency, payment_observed_reference, currency, wise_reference, payment_disposition, amount_due, amount_paid, verified_revenue, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, origin_state, execution_truth, scheduled_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(250);

  const matters = ((data ?? []) as SchedulingMatter[]).filter((matter) => {
    const state = resolveOperationalMatterState(matter).state;
    return state !== "completed" && state !== "lost" && state !== "cancelled";
  });

  const projections = matters.map((matter) => {
    const blockers = operationalBlockers(matter);
    const gate = evaluateSchedulingGate({ matter, allOperationalRequirementsPassed: blockers.length === 0 });
    return { matter, blockers, gate, ready: blockers.length === 0 && gate.schedulingEligible };
  });

  const readyCount = projections.filter((item) => item.ready).length;
  const blockedCount = projections.length - readyCount;
  const processingCount = projections.filter((item) => !item.gate.schedulingEligible && Boolean(item.matter.payment_observed_at)).length;

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-4 py-5 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-2xl border border-[#C6A65B]/20 bg-[radial-gradient(circle_at_80%_0%,rgba(198,166,91,0.12),transparent_34%),linear-gradient(135deg,#070707,#0b0b0b)] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.36)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A65B]/60">Execution / Scheduling Authority</p>
            <h1 className="mt-2 font-serif text-3xl text-[#F6F1E6]">Scheduling Readiness Console</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">One read-only view of the canonical Matter gate. Wise processing may authorize scheduling when recorded by the existing gate, while verified settlement remains separate paid truth.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[390px]">
            {[["Ready", readyCount, "text-emerald-300"], ["Blocked", blockedCount, "text-amber-300"], ["Wise Processing", processingCount, "text-[#E4CA8C]"]].map(([label, value, tone]) => (
              <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-black/25 p-3 text-center">
                <p className={`text-xl font-semibold ${tone}`}>{value}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5 text-sm text-red-200">Canonical Matter data is unavailable. Readiness is not being inferred.</section>
      ) : projections.length === 0 ? (
        <section className="rounded-2xl border border-white/[0.07] bg-[#090909] p-10 text-center text-sm text-white/35">No active Matters require scheduling review.</section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {projections.map(({ matter, blockers, gate, ready }) => {
            const state = resolveOperationalMatterState(matter).state;
            const displayId = operationalMatterDisplayId(matter);
            const focused = focusMatter === matter.id || focusMatter === displayId;
            return (
              <article key={matter.id} className={`overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0b0b0b] to-[#070707] ${focused ? "border-[#C6A65B]/60 shadow-[0_0_45px_rgba(198,166,91,0.12)]" : ready ? "border-emerald-500/20" : "border-amber-500/20"}`}>
                <div className="border-b border-white/[0.055] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A65B]/55">{displayId}</p>
                      <h2 className="mt-1 truncate text-base font-semibold text-white/90">{operationalClientName(matter)}</h2>
                      <p className="mt-1 truncate text-xs text-white/35">{operationalDocumentType(matter) ?? "Document unresolved"} · {operationalDestinationCountry(matter) ?? "Destination unresolved"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] ${ready ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300" : "border-amber-500/30 bg-amber-500/[0.07] text-amber-200"}`}>{ready ? "Ready" : "Blocked"}</span>
                  </div>
                </div>

                <div className="space-y-4 p-4 sm:p-5">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3">
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">Current Stage</p>
                      <p className="mt-1 text-xs capitalize text-white/70">{stateLabel(state)}</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3 sm:col-span-2">
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">Payment Authority</p>
                      <p className={`mt-1 text-xs ${gate.paymentRequirementSatisfied ? "text-emerald-300" : "text-amber-200"}`}>{paymentMethodLabel(gate.paymentRequirementMethod)}</p>
                    </div>
                  </div>

                  <div className={`rounded-xl border p-4 ${ready ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "border-amber-500/20 bg-amber-500/[0.04]"}`}>
                    <p className={`font-mono text-[8px] uppercase tracking-[0.16em] ${ready ? "text-emerald-300" : "text-amber-200"}`}>Action Required</p>
                    {ready ? <p className="mt-2 text-sm text-white/65">No readiness blocker remains. Review the Matter and schedule through the existing execution flow.</p> : <ul className="mt-2 space-y-1.5 text-xs leading-5 text-white/60">{[...blockers, ...(!gate.paymentRequirementSatisfied && !blockers.includes(gate.reason) ? [gate.reason] : [])].map((blocker) => <li key={blocker} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" /><span>{blocker}</span></li>)}</ul>}
                  </div>

                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/25">Next Expected Event</p>
                    <p className="mt-1 text-xs leading-5 text-white/45">{nextEvent(matter, ready)}</p>
                  </div>

                  <Link href={`/dashboard/deals/${encodeURIComponent(matter.id)}`} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-[#C6A65B]/25 bg-[#C6A65B]/[0.055] px-4 py-2.5 text-sm font-semibold text-[#E4CA8C] transition hover:border-[#C6A65B]/45 hover:bg-[#C6A65B]/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A65B]/60">Open Matter Readiness →</Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
