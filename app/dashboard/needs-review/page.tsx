export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import {
  loadOperatorIntelligence,
  type OperatorMatterAction,
} from "@/lib/operator-intelligence/read-model";

interface PageProps {
  searchParams: Promise<{
    matter?: string;
    deal?: string;
    focus?: string;
  }>;
}

const REVIEW_CLASSES = new Set([
  "Document Blocked",
  "Authority Review",
  "Courier Exception",
]);

function matchesMatter(
  action: OperatorMatterAction,
  matter: string | null,
  deal: string | null,
) {
  if (!matter && !deal) return true;
  return action.internalId === matter || action.matterId === deal;
}

export default async function NeedsReviewPage({ searchParams }: PageProps) {
  await requireDashboardAccess();
  const params = await searchParams;
  const matter = params.matter?.trim() || null;
  const deal = params.deal?.trim() || null;

  let snapshot;
  try {
    snapshot = await loadOperatorIntelligence();
  } catch (error) {
    console.error("[needs-review] canonical read failed:", error);
    return (
      <section className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-red-300/70">
          Needs Review
        </p>
        <h1 className="mt-2 font-serif text-2xl text-white/90">
          Review truth unavailable
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Canonical Matter intelligence could not be read. Do not interpret this as
          an empty review queue.
        </p>
      </section>
    );
  }

  const items = snapshot.actions.filter(
    (action) =>
      REVIEW_CLASSES.has(action.actionClass) &&
      matchesMatter(action, matter, deal),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#C6A55A]/15 bg-[#080808] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C6A55A]/55">
              Operator Control Layer
            </p>
            <h1 className="mt-2 font-serif text-2xl font-normal text-[#F4E5B8]">
              Needs Review Queue
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
              Live review conditions derived from canonical Matter state, execution
              truth and shipment state. No hardcoded review items and no client-facing
              release bypass.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(matter || deal) && (
              <Link
                href="/dashboard/needs-review"
                className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55 hover:border-[#C6A55A]/30"
              >
                Clear Matter Filter
              </Link>
            )}
            <Link
              href="/today"
              className="rounded-lg border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#E4CA8C]/75 hover:border-[#C6A55A]/40"
            >
              Back to Today
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {["Document Blocked", "Authority Review", "Courier Exception"].map(
            (label) => (
              <div
                key={label}
                className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-3"
              >
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">
                  {label}
                </p>
                <p className="mt-1 text-xl font-light text-[#E4CA8C]">
                  {items.filter((item) => item.actionClass === label).length}
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      {snapshot.degraded ? (
        <section className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-200/70">
            Degraded Review Read
          </p>
          <p className="mt-2 text-xs leading-5 text-white/45">
            {snapshot.warning}
          </p>
        </section>
      ) : null}

      {items.length === 0 ? (
        <section className="rounded-xl border border-white/[0.07] bg-[#090909] px-5 py-16 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
            No matching review conditions
          </p>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-white/25">
            The canonical read model returned no current Document Blocked, Authority
            Review or Courier Exception conditions for this filter.
          </p>
        </section>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-white/[0.07] bg-[#090909] p-4 sm:p-5"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[#E4CA8C]/70">
                      {item.actionClass}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">
                      {item.priority}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Link
                      href={item.matterHref}
                      className="font-mono text-[11px] text-[#E4CA8C] hover:underline"
                    >
                      {item.matterId}
                    </Link>
                    <span className="text-xs text-white/45">{item.clientName}</span>
                  </div>

                  <p className="mt-2 max-w-3xl text-xs leading-5 text-white/40">
                    {item.reason}
                  </p>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-x-5 gap-y-2 lg:min-w-[300px]">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">
                      State
                    </p>
                    <p className="mt-1 text-[11px] capitalize text-white/45">
                      {item.state.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">
                      Destination
                    </p>
                    <p className="mt-1 text-[11px] text-white/45">
                      {item.destinationCountry ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.05] pt-4">
                <Link
                  href={item.matterHref}
                  className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-[10px] text-white/55 hover:border-[#C6A55A]/30 hover:text-white/85"
                >
                  Open Matter
                </Link>
                {item.actionClass === "Authority Review" ? (
                  <Link
                    href={item.actionHref}
                    className="rounded-lg border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] px-3 py-2 text-[10px] text-[#E4CA8C]/75 hover:border-[#C6A55A]/40"
                  >
                    Open Authority Evidence
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
