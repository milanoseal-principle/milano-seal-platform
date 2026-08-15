export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import {
  loadOperatorIntelligence,
  OPERATOR_ACTION_CLASSES,
  type OperatorActionClass,
  type OperatorIntelligenceSnapshot,
  type OperatorPriority,
} from "@/lib/operator-intelligence/read-model";

const ACTION_META: Record<
  OperatorActionClass,
  { eyebrow: string; href: string; description: string }
> = {
  "Payment Blocked": {
    eyebrow: "PAYMENT",
    href: "/dashboard/ledger",
    description: "Matter progression is waiting on verified canonical payment truth.",
  },
  "Document Blocked": {
    eyebrow: "DOCUMENT",
    href: "/dashboard/needs-review",
    description: "Client information or document correction is blocking progression.",
  },
  "Authority Review": {
    eyebrow: "AUTHORITY",
    href: "/dashboard/authorities/verify",
    description: "Execution, notarization or destination authority requires review.",
  },
  "Scheduling Due": {
    eyebrow: "SCHEDULING",
    href: "/dashboard/pipeline",
    description: "Verified payment is present and governed scheduling action is due.",
  },
  "Apostille Pending": {
    eyebrow: "APOSTILLE",
    href: "/dashboard/apostille",
    description: "Matter is inside the governed apostille execution sequence.",
  },
  "Courier Exception": {
    eyebrow: "COURIER",
    href: "/dashboard/courier",
    description: "Shipment custody, customs or SLA truth requires operator attention.",
  },
  "Release Ready": {
    eyebrow: "RELEASE",
    href: "/workspace/release",
    description: "Matter is eligible for governed release QA and packet progression.",
  },
  "Overdue Follow-Up": {
    eyebrow: "FOLLOW-UP",
    href: "/dashboard/follow-ups",
    description: "Canonical payment follow-up cadence is overdue.",
  },
};

const PRIORITY_STYLE: Record<
  OperatorPriority,
  { label: string; className: string }
> = {
  critical: {
    label: "CRITICAL",
    className: "border-red-500/25 bg-red-500/[0.06] text-red-300",
  },
  high: {
    label: "HIGH",
    className: "border-[#C6A55A]/30 bg-[#C6A55A]/[0.06] text-[#E4CA8C]",
  },
  normal: {
    label: "NORMAL",
    className: "border-white/10 bg-white/[0.03] text-white/45",
  },
};

function formatTimestamp(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function FailureState() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <section className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-red-300/70">
          Operator Intelligence
        </p>
        <h1
          className="mt-2 text-2xl font-light text-white/90"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Canonical Matter read unavailable
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
          The action queue could not be safely derived from canonical Matter truth.
          This is not an all-clear state. Do not infer that zero Matters require action.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/pipeline"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/65 transition hover:border-[#C6A55A]/30 hover:text-white"
          >
            Open Matter Pipeline
          </Link>
          <Link
            href="/dashboard/monitoring"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/65 transition hover:border-[#C6A55A]/30 hover:text-white"
          >
            Open Monitoring
          </Link>
        </div>
      </section>
    </div>
  );
}

function CapabilityStatus({ snapshot }: { snapshot: OperatorIntelligenceSnapshot }) {
  const capabilities = [
    ["Canonical Matter Read", snapshot.capabilities.richMatterRead],
    ["Execution Truth", snapshot.capabilities.executionTruth],
    ["Follow-Up Signals", snapshot.capabilities.followUps],
    ["SLA Deadline", snapshot.capabilities.slaDeadline],
  ] as const;

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {capabilities.map(([label, enabled]) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            {label}
          </span>
          <span
            className={
              enabled
                ? "font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-300/70"
                : "font-mono text-[9px] uppercase tracking-[0.14em] text-amber-300/70"
            }
          >
            {enabled ? "LIVE" : "SUPPRESSED"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function TodayPage() {
  await requireDashboardAccess();

  let snapshot: OperatorIntelligenceSnapshot;

  try {
    snapshot = await loadOperatorIntelligence();
  } catch (error) {
    console.error("[today] Milano Operator Intelligence unavailable:", error);
    return <FailureState />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <section className="overflow-hidden rounded-xl border border-[#C6A55A]/15 bg-[#080808]">
        <div className="border-b border-white/[0.06] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/60">
                Milano Operator Intelligence
              </p>
              <h1
                className="mt-2 text-3xl font-light text-[#F6F1E6] sm:text-4xl"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                Today
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
                Read-only contextual command layer over the canonical Matter, payment
                and execution system. This surface derives action intelligence only.
                It does not mutate Matter state.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-right sm:flex sm:gap-6">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/25">
                  Matters Read
                </p>
                <p className="mt-1 text-lg text-white/70">{snapshot.mattersRead}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/25">
                  Actions
                </p>
                <p className="mt-1 text-lg text-[#E4CA8C]">{snapshot.actions.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <CapabilityStatus snapshot={snapshot} />
        </div>
      </section>

      {snapshot.degraded ? (
        <section className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-200/70">
            Degraded Intelligence Read
          </p>
          <p className="mt-2 text-sm leading-6 text-white/50">{snapshot.warning}</p>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C6A55A]/50">
              Action Matrix
            </p>
            <h2
              className="mt-1 text-xl font-light text-white/80"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              Canonical Action Classes
            </h2>
          </div>
          <p className="hidden font-mono text-[8px] uppercase tracking-[0.14em] text-white/20 sm:block">
            READ ONLY
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {OPERATOR_ACTION_CLASSES.map((actionClass) => {
            const meta = ACTION_META[actionClass];
            const count = snapshot.counts[actionClass];

            return (
              <Link
                key={actionClass}
                href={meta.href}
                className="group rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4 transition hover:border-[#C6A55A]/25 hover:bg-[#C6A55A]/[0.025]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#C6A55A]/45">
                      {meta.eyebrow}
                    </p>
                    <p className="mt-1.5 text-sm text-white/70 transition group-hover:text-white/90">
                      {actionClass}
                    </p>
                  </div>
                  <span className="text-2xl font-light text-[#E4CA8C]">{count}</span>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-white/30">{meta.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C6A55A]/50">
              Live Matter Intelligence
            </p>
            <h2
              className="mt-1 text-xl font-light text-white/80"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              Actions Requiring Operator Attention
            </h2>
          </div>
          <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">
            Generated {formatTimestamp(snapshot.generatedAt)}
          </p>
        </div>

        {snapshot.actions.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-8 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#C6A55A]/50">
              No Derived Actions
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/35">
              No actionable condition was derived from the canonical Matter records
              currently visible to this read model. This statement is valid only while
              all capability indicators above are LIVE.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {snapshot.actions.map((action) => {
              const priority = PRIORITY_STYLE[action.priority];

              return (
                <article
                  key={action.id}
                  className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] ${priority.className}`}
                        >
                          {priority.label}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#C6A55A]/55">
                          {action.actionClass}
                        </span>
                      </div>

                      <div className="mt-3">
                        <p className="truncate text-sm font-medium text-white/75">
                          {action.clientName}
                        </p>
                        <p className="mt-1 break-all font-mono text-[9px] text-white/25">
                          {action.matterId}
                        </p>
                      </div>

                      <p className="mt-3 max-w-3xl text-[12px] leading-5 text-white/45">
                        {action.reason}
                      </p>
                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-x-5 gap-y-3 text-left lg:min-w-[320px]">
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">
                          State
                        </p>
                        <p className="mt-1 text-[11px] text-white/45">
                          {action.state.replaceAll("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">
                          Payment
                        </p>
                        <p className="mt-1 text-[11px] text-white/45">
                          {action.paymentStatus.replaceAll("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">
                          Destination
                        </p>
                        <p className="mt-1 text-[11px] text-white/45">
                          {action.destinationCountry ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">
                          Due / SLA
                        </p>
                        <p className="mt-1 text-[11px] text-white/45">
                          {formatTimestamp(action.dueAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.05] pt-4">
                    <Link
                      href={action.matterHref}
                      className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-[10px] text-white/55 transition hover:border-[#C6A55A]/30 hover:text-white/85"
                    >
                      Open Matter
                    </Link>
                    <Link
                      href={action.actionHref}
                      className="rounded-lg border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] px-3 py-2 text-[10px] text-[#E4CA8C]/75 transition hover:border-[#C6A55A]/40 hover:text-[#F2D995]"
                    >
                      Open Action Workspace
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.05] pt-5 sm:flex-row sm:items-center">
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/15">
          CANONICAL MATTER TRUTH → CONTEXTUAL INTELLIGENCE → HUMAN ACTION
        </p>
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#C6A55A]/30">
          THE MILANO SEAL™
        </p>
      </footer>
    </div>
  );
}
