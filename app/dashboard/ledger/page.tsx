export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadOperationalLedger } from "@/lib/operator-intelligence/ledger-read-model";

interface PageProps {
  searchParams: Promise<{
    matter?: string;
    deal?: string;
    focus?: string;
  }>;
}

const SOURCE_LABEL = {
  matter_events: "MATTER",
  deal_events: "DEAL",
  custody_ledger: "CUSTODY",
} as const;

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export default async function LedgerPage({ searchParams }: PageProps) {
  await requireDashboardAccess();
  const params = await searchParams;
  const matterFilter = params.matter?.trim() || null;

  let snapshot;
  try {
    snapshot = await loadOperationalLedger({
      matterId: matterFilter,
      limit: matterFilter ? 250 : 150,
    });
  } catch (error) {
    console.error("[ledger] live operational ledger unavailable:", error);
    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-red-300/70">
            Operational Ledger
          </p>
          <h1 className="mt-2 font-serif text-2xl text-white/90">
            Live event sources unavailable
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
            The ledger could not be read safely. This is not an empty-ledger state.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#C6A55A]/15 bg-[#080808] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C6A55A]/55">
              Operator Control Layer
            </p>
            <h1 className="mt-2 font-serif text-2xl font-normal text-[#F4E5B8]">
              Operational Ledger
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
              Live append-only evidence from Matter events, deal events and custody
              ledger sources. This page reads production truth only; it does not
              advance Matter state.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {matterFilter ? (
              <Link
                href="/dashboard/ledger"
                className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55 hover:border-[#C6A55A]/30 hover:text-white/80"
              >
                Clear Matter Filter
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

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {(["matter_events", "deal_events", "custody_ledger"] as const).map(
            (source) => {
              const count = snapshot.entries.filter((entry) => entry.source === source).length;
              return (
                <div
                  key={source}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-3"
                >
                  <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/25">
                    {SOURCE_LABEL[source]}
                  </p>
                  <p className="mt-1 text-xl font-light text-[#E4CA8C]">{count}</p>
                </div>
              );
            },
          )}
        </div>
      </section>

      {snapshot.degraded ? (
        <section className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-200/70">
            Partial Ledger Read
          </p>
          <p className="mt-2 text-xs leading-5 text-white/45">
            {snapshot.sourceErrors.join(" · ")}
          </p>
        </section>
      ) : null}

      {matterFilter ? (
        <section className="rounded-lg border border-[#C6A55A]/15 bg-[#C6A55A]/[0.03] px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#C6A55A]/55">
            Focused Matter
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-white/55">
            {matterFilter}
          </p>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#090909]">
        <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/45">
              Live Events
            </p>
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">
              {snapshot.entries.length} records
            </p>
          </div>
        </div>

        {snapshot.entries.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
              No matching ledger entries
            </p>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-white/25">
              The connected production event sources returned no entries for this
              filter. This is a real empty result, not a hardcoded placeholder.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {snapshot.entries.map((entry) => (
              <article key={entry.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-[#C6A55A]/15 bg-[#C6A55A]/[0.04] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[#C6A55A]/70">
                        {SOURCE_LABEL[entry.source]}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
                        {entry.eventName.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Link
                        href={entry.matterHref}
                        className="font-mono text-[11px] text-[#E4CA8C] hover:underline"
                      >
                        {entry.matterId}
                      </Link>
                      <span className="text-xs text-white/45">{entry.clientName}</span>
                    </div>

                    {entry.description ? (
                      <p className="mt-2 max-w-3xl break-words text-xs leading-5 text-white/38">
                        {entry.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid shrink-0 grid-cols-2 gap-x-5 gap-y-2 lg:min-w-[320px]">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">
                        Current State
                      </p>
                      <p className="mt-1 text-[11px] capitalize text-white/45">
                        {entry.currentState}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">
                        Actor
                      </p>
                      <p className="mt-1 truncate text-[11px] text-white/45">
                        {entry.actor ?? "system / unknown"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">
                        Timestamp
                      </p>
                      <p className="mt-1 text-[11px] text-white/35">
                        {formatTimestamp(entry.occurredAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
