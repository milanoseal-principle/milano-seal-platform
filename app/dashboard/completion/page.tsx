export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
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
  title: "Matter Completion — The Milano Seal™",
  robots: { index: false, follow: false },
};

interface CompletionMatter extends OperationalMatterSourceRow {
  id: string;
  deal_id?: string | null;
  delivery_timestamp?: string | null;
  completed_at?: string | null;
  is_paid_and_released?: boolean | null;
}

interface NotificationEvidence {
  deal_id: string | null;
  type: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function notificationProvesClientDelivery(row: NotificationEvidence) {
  const type = row.type.toLowerCase();
  const status = row.status.toLowerCase();
  const deliveryType = type.includes("delivery") || type.includes("delivered") || type.includes("completion") || type.includes("completed");
  const acceptedStatus = ["sent", "delivered", "provider_accepted"].includes(status);
  return deliveryType && acceptedStatus && Boolean(row.sent_at ?? row.created_at);
}

export default async function CompletionPage() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  const [{ data: matterData, error: matterError }, { data: notificationData, error: notificationError }] = await Promise.all([
    supabase
      .from("deals")
      .select("id, deal_id, client_name, full_name, destination_country, country, document_type, document, service_type, status, deal_status, payment_status, payment_confirmed, payment_settlement_status, amount_due, amount_paid, tracking_number, carrier, delivery_status, delivery_at, delivery_timestamp, completed_at, is_paid_and_released, updated_at")
      .order("updated_at", { ascending: false })
      .limit(300),
    supabase
      .from("notifications")
      .select("deal_id, type, status, sent_at, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const notificationEvidence = (notificationData ?? []) as NotificationEvidence[];
  const notifiedMatterIds = new Set(notificationEvidence.filter(notificationProvesClientDelivery).map((row) => row.deal_id).filter(Boolean));

  const matters = ((matterData ?? []) as CompletionMatter[])
    .map((matter) => ({ matter, state: resolveOperationalMatterState(matter).state }))
    .filter(({ state }) => state === "delivered" || state === "completed");

  const rows = matters.map(({ matter, state }) => {
    const delivered = state === "delivered" || state === "completed" || matter.delivery_status?.toLowerCase() === "delivered";
    const deliveryEvidence = delivered && Boolean(matter.delivery_timestamp ?? matter.delivery_at);
    const clientNotified = notifiedMatterIds.has(matter.id);
    const completionRecorded = state === "completed";
    const readyToClose = state === "delivered" && deliveryEvidence && clientNotified;
    const blockers = [
      !deliveryEvidence ? "Verified delivery timestamp/evidence is required." : null,
      !clientNotified ? "Client delivery/completion notification evidence is required." : null,
    ].filter(Boolean) as string[];
    return { matter, state, deliveryEvidence, clientNotified, completionRecorded, readyToClose, blockers };
  });

  const completeCount = rows.filter((row) => row.completionRecorded).length;
  const readyCount = rows.filter((row) => row.readyToClose).length;
  const blockedCount = rows.filter((row) => !row.completionRecorded && !row.readyToClose).length;
  const readError = matterError || notificationError;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-2xl border border-[#C6A65B]/20 bg-[radial-gradient(circle_at_82%_0%,rgba(74,158,107,0.11),transparent_30%),radial-gradient(circle_at_18%_0%,rgba(198,166,91,0.11),transparent_32%),linear-gradient(135deg,#070707,#0b0b0b)] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.36)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A65B]/60">Custody / Delivery / Close</p>
            <h1 className="mt-2 font-serif text-3xl text-[#F6F1E6]">Matter Completion Desk</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Final fail-closed review of delivered Matters. This surface never closes a Matter itself; it projects the canonical completion requirements so operators use the existing governed transition path.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            {[["Ready to Close", readyCount, "text-emerald-300"], ["Blocked", blockedCount, "text-amber-300"], ["Completed", completeCount, "text-[#E4CA8C]"]].map(([label, value, color]) => (
              <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-black/25 p-3 text-center">
                <p className={`text-xl font-semibold ${color}`}>{value}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {readError ? (
        <section className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5 text-sm text-red-200">Completion evidence could not be fully read. No Matter is being inferred ready.</section>
      ) : rows.length === 0 ? (
        <section className="rounded-2xl border border-white/[0.07] bg-[#090909] p-10 text-center text-sm text-white/35">No delivered or completed Matters are in the completion queue.</section>
      ) : (
        <section className="space-y-4">
          {rows.map(({ matter, state, deliveryEvidence, clientNotified, completionRecorded, readyToClose, blockers }) => (
            <article key={matter.id} className={`rounded-2xl border bg-[#090909] p-4 sm:p-5 ${completionRecorded ? "border-[#C6A65B]/20" : readyToClose ? "border-emerald-500/25" : "border-amber-500/20"}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A65B]/55">{operationalMatterDisplayId(matter)}</p>
                    <span className={`rounded-full border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] ${completionRecorded ? "border-[#C6A65B]/25 bg-[#C6A65B]/[0.06] text-[#E4CA8C]" : readyToClose ? "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-300" : "border-amber-500/25 bg-amber-500/[0.06] text-amber-200"}`}>{completionRecorded ? "Completed" : readyToClose ? "Ready to Close" : "Completion Blocked"}</span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-white/90">{operationalClientName(matter)}</h2>
                  <p className="mt-1 text-xs text-white/35">{operationalDocumentType(matter) ?? "Document unresolved"} · {operationalDestinationCountry(matter) ?? "Destination unresolved"}</p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/[0.055] bg-white/[0.015] p-3">
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">Current Stage</p>
                      <p className="mt-1 text-xs capitalize text-white/65">{stateLabel(state)}</p>
                    </div>
                    <div className={`rounded-xl border p-3 ${deliveryEvidence ? "border-emerald-500/15 bg-emerald-500/[0.035]" : "border-amber-500/15 bg-amber-500/[0.035]"}`}>
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">Delivery Evidence</p>
                      <p className={`mt-1 text-xs ${deliveryEvidence ? "text-emerald-300" : "text-amber-200"}`}>{deliveryEvidence ? "Verified evidence present" : "Evidence required"}</p>
                    </div>
                    <div className={`rounded-xl border p-3 ${clientNotified ? "border-emerald-500/15 bg-emerald-500/[0.035]" : "border-amber-500/15 bg-amber-500/[0.035]"}`}>
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">Client Notification</p>
                      <p className={`mt-1 text-xs ${clientNotified ? "text-emerald-300" : "text-amber-200"}`}>{clientNotified ? "Notification evidence present" : "Evidence required"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">Tracking / Delivery</p>
                      <p className="mt-1 text-xs text-white/50">{matter.carrier ?? "Carrier —"} · {matter.tracking_number ?? "Tracking —"}</p>
                      <p className="mt-1 font-mono text-[9px] text-white/30">{formatDate(matter.delivery_timestamp ?? matter.delivery_at)}</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">Next Expected Event</p>
                      <p className="mt-1 text-xs leading-5 text-white/50">{completionRecorded ? "Matter is already in canonical completed state." : readyToClose ? "Operator may use the existing governed Matter transition to complete." : "Resolve all completion blockers before any close transition."}</p>
                    </div>
                  </div>

                  {blockers.length > 0 && !completionRecorded ? (
                    <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3">
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-amber-200">Action Required</p>
                      <ul className="mt-2 space-y-1.5 text-xs text-white/55">{blockers.map((blocker) => <li key={blocker} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" /><span>{blocker}</span></li>)}</ul>
                    </div>
                  ) : null}
                </div>

                <div className="flex min-w-[190px] flex-col gap-2">
                  <Link href={`/dashboard/deals/${encodeURIComponent(matter.id)}`} className="flex min-h-11 items-center justify-center rounded-xl border border-[#C6A65B]/25 bg-[#C6A65B]/[0.055] px-4 py-2 text-xs font-semibold text-[#E4CA8C] transition hover:border-[#C6A65B]/45 hover:bg-[#C6A65B]/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A65B]/60">Open Matter →</Link>
                  <Link href={`/dashboard/releases?matter=${encodeURIComponent(matter.id)}`} className="flex min-h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs font-semibold text-white/60 transition hover:border-white/15 hover:text-white/80">Open Release Evidence →</Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
