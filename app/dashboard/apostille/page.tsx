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
  title: "Apostille Tracker — Milano Seal",
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

const SUBMITTED_STATES = new Set([
  "apostille_submitted",
  "apostille_processing",
]);

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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function statusMeta(state: string | null) {
  if (state === "apostille_rejected") {
    return {
      label: "Exception",
      className: "border-red-500/25 bg-red-500/[0.06] text-red-300",
    };
  }
  if (state && RECEIVED_OR_LATER_STATES.has(state)) {
    return {
      label: "Received / Complete",
      className: "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300/80",
    };
  }
  if (state && SUBMITTED_STATES.has(state)) {
    return {
      label: "Submitted",
      className: "border-[#C6A55A]/25 bg-[#C6A55A]/[0.05] text-[#E4CA8C]",
    };
  }
  return {
    label: "Pending",
    className: "border-amber-400/20 bg-amber-400/[0.05] text-amber-200/75",
  };
}

export default async function ApostillePage({ searchParams }: PageProps) {
  await requireDashboardAccess();
  const params = await searchParams;
  const focusMatter = params.matter?.trim() || params.deal?.trim() || null;
  const supabase = createAdminClient();

  // Read the canonical Matter state as well as historical apostille flags. Some
  // legacy production rows reached apostille states before both flag columns were
  // backfilled, so a flag-only SQL filter can produce a false-empty tracker.
  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, deal_id, client_name, full_name, destination_country, country, document_type, document, service_type, status, deal_status, apostille_required, requires_apostille, apostille_at, scheduled_at, created_at, updated_at, due_at, sla_deadline",
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[apostille] canonical read failed:", error.message);
  }

  const matters = ((data ?? []) as ApostilleMatter[])
    .map((row) => ({
      row,
      state: resolveOperationalMatterState(row).state,
    }))
    .filter(
      ({ row, state }) =>
        row.apostille_required === true ||
        row.requires_apostille === true ||
        Boolean(state && APOSTILLE_RELATED_STATES.has(state)),
    );

  const counts = {
    pending: matters.filter(
      ({ state }) =>
        !state ||
        (!SUBMITTED_STATES.has(state) &&
          !RECEIVED_OR_LATER_STATES.has(state) &&
          state !== "apostille_rejected"),
    ).length,
    submitted: matters.filter(
      ({ state }) => state && SUBMITTED_STATES.has(state),
    ).length,
    exceptions: matters.filter(
      ({ state }) => state === "apostille_rejected",
    ).length,
    received: matters.filter(
      ({ state }) => state && RECEIVED_OR_LATER_STATES.has(state),
    ).length,
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#C6A55A]/15 bg-[#080808] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C6A55A]/55">
              Milano Seal / Apostille Tracker
            </p>
            <h1 className="mt-2 font-serif text-2xl font-normal text-[#F4E5B8]">
              Apostille Submission Tracker
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
              Live apostille Matters projected from canonical Matter state plus
              historical apostille flags. Legacy status labels are compatibility-read
              only and are never written from this surface.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {focusMatter ? (
              <Link
                href="/dashboard/apostille"
                className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55 hover:border-[#C6A55A]/30"
              >
                Clear Focus
              </Link>
            ) : null}
            <Link
              href="/today"
              className="rounded-lg border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#E4CA8C]/75 hover:border-[#C6A55A]/40"
            >
              Back to Today
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            ["Pending", counts.pending],
            ["Submitted", counts.submitted],
            ["Exceptions", counts.exceptions],
            ["Received / Complete", counts.received],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-3"
            >
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">
                {label}
              </p>
              <p className="mt-1 text-xl font-light text-[#E4CA8C]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-red-300/70">
            Apostille Data Unavailable
          </p>
          <p className="mt-2 text-xs leading-5 text-white/45">
            Production Matter data could not be read. This is not an empty tracker.
          </p>
        </section>
      ) : matters.length === 0 ? (
        <section className="rounded-xl border border-white/[0.07] bg-[#090909] px-5 py-16 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
            No apostille-related Matters
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#090909]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {[
                    "Matter",
                    "Client",
                    "Destination",
                    "Document",
                    "Canonical State",
                    "Submitted",
                    "Scheduled",
                    "Apostille Status",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-[#C6A55A]/45"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matters.map(({ row, state }) => {
                  const displayId = operationalMatterDisplayId(row);
                  const focused =
                    focusMatter === row.id || focusMatter === displayId;
                  const meta = statusMeta(state);
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-white/[0.04] ${focused ? "bg-[#C6A55A]/[0.05]" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/deals/${encodeURIComponent(row.id)}`}
                          className="font-mono text-[10px] text-[#E4CA8C] hover:underline"
                        >
                          {displayId}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/65">
                        {operationalClientName(row)}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50">
                        {operationalDestinationCountry(row) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/45">
                        {operationalDocumentType(row) ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] capitalize text-white/45">
                        {stateLabel(state)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-white/35">
                        {formatDate(row.apostille_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-white/35">
                        {formatDate(row.scheduled_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
