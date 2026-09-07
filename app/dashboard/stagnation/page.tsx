"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  PipelineStagnationSummary,
  StagnationEvaluation,
  StagnationSeverity,
} from "@/lib/matter/pipelineStagnation";

// Operator-only Pipeline Stagnation Alerts surface.
// Renders the server-derived stagnation summary. Amber = Alarm state; it warns
// operators when a Matter has been in a stage (or without activity) beyond an
// internal operating threshold. It asserts no SLA and never shows client-facing
// alarm language — this route is operator-gated.

const SEVERITY_STYLE: Record<StagnationSeverity, { tone: string; label: string }> = {
  CRITICAL: { tone: "border-red-400/40 bg-red-400/[0.06] text-red-200", label: "Critical" },
  ALERT: { tone: "border-amber-400/40 bg-amber-400/[0.06] text-amber-200", label: "Alarm Amber" },
  WATCH: { tone: "border-yellow-300/30 bg-yellow-300/[0.04] text-yellow-100/90", label: "Watch" },
  INSUFFICIENT_EVIDENCE: { tone: "border-white/12 bg-white/[0.02] text-white/55", label: "Insufficient Evidence" },
  OK: { tone: "border-white/10 bg-black/25 text-white/60", label: "OK" },
};

function relativeAge(hours: number | null): string {
  if (hours == null) return "—";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export default function PipelineStagnationPage() {
  const [summary, setSummary] = useState<PipelineStagnationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/stagnation", { cache: "no-store" });
        if (active) setStatus(res.status);
        if (!res.ok) throw new Error(`Stagnation read failed (${res.status})`);
        const data = (await res.json()) as PipelineStagnationSummary;
        if (active) setSummary(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load stagnation alerts.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const counts = summary?.counts;
  const unauthorized = status === 401 || status === 403;

  const headline = useMemo(() => {
    if (!counts) return null;
    return [
      { label: "Critical", value: counts.CRITICAL, tone: "text-red-300" },
      { label: "Alarm Amber", value: counts.ALERT, tone: "text-amber-300" },
      { label: "Watch", value: counts.WATCH, tone: "text-yellow-200" },
      { label: "Insufficient Evidence", value: counts.INSUFFICIENT_EVIDENCE, tone: "text-white/60" },
    ];
  }, [counts]);

  return (
    <main className="space-y-7 pb-16">
      <section className="rounded-3xl border border-[var(--ms-gold)]/20 bg-[#0d0d0d] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--ms-gold)]">
            Operator Intelligence · Pipeline Stagnation
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Operator-only</div>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-light text-white">Stage Stagnation Alerts</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
          Warns when a Matter has been in a stage — or without activity — beyond an internal operating
          threshold. Thresholds are operating heuristics, not service-level guarantees. Where a reliable
          stage-entry or last-activity time cannot be proven, the Matter is listed under Insufficient
          Evidence rather than assigned a fabricated age.
        </p>
        {headline ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {headline.map((h) => (
              <div key={h.label} className="rounded-xl border border-white/8 bg-black/25 p-4">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">{h.label}</div>
                <div className={`mt-1.5 text-2xl font-semibold ${h.tone}`}>{h.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#111] p-6 text-sm text-white/50" role="status" aria-live="polite">
          Evaluating pipeline stage ages…
        </div>
      ) : null}

      {unauthorized ? (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-300/5 p-6 text-sm text-amber-100">
          Pipeline stagnation alerts are operator-only. Sign in with an operator account.
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-sm text-red-200">{error}</div>
      ) : null}

      {!loading && !error && summary ? (
        <>
          <section aria-labelledby="active-alerts">
            <h2 id="active-alerts" className="text-xs uppercase tracking-[0.2em] text-[var(--ms-gold)]">
              Active Alerts
            </h2>
            {summary.alerts.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.04] p-6 text-sm text-emerald-100/80">
                No matters are stagnant beyond threshold across {summary.evaluatedCount} evaluated.
              </div>
            ) : (
              <div className="mt-3 grid gap-3">
                {summary.alerts.map((a) => (
                  <StagnationCard key={a.matterId} a={a} />
                ))}
              </div>
            )}
          </section>

          {summary.insufficientEvidence.length > 0 ? (
            <section aria-labelledby="insufficient">
              <h2 id="insufficient" className="text-xs uppercase tracking-[0.2em] text-white/45">
                Insufficient Evidence ({summary.insufficientEvidence.length})
              </h2>
              <p className="mt-1 text-xs text-white/40">
                Monitored stage, but no reliable timestamp to prove stage age. Not counted as stagnant.
              </p>
              <div className="mt-3 grid gap-2">
                {summary.insufficientEvidence.map((a) => (
                  <Link
                    key={a.matterId}
                    href={a.href}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0e0e0e] p-3 text-sm transition hover:border-[var(--ms-gold)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)]/50"
                  >
                    <span className="font-mono text-xs text-white/60">{a.displayId}</span>
                    <span className="text-white/70">{a.stageLabel}</span>
                    <span className="text-xs text-white/40">{a.reason}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <p className="text-[10px] uppercase tracking-[0.14em] text-white/25">
            Generated {new Date(summary.generatedAt).toLocaleString()} · {summary.evaluatedCount} matters evaluated
          </p>
        </>
      ) : null}
    </main>
  );
}

function StagnationCard({ a }: { a: StagnationEvaluation }) {
  const style = SEVERITY_STYLE[a.severity];
  return (
    <article className={`rounded-2xl border p-5 ${style.tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
              {style.label}
            </span>
            {a.overdueByHours != null ? (
              <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                Overdue +{relativeAge(a.overdueByHours)}
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-lg font-semibold text-white/90">{a.stageLabel}</div>
          <div className="mt-0.5 text-xs text-white/50">
            {a.clientName ?? "Client unresolved"}
            {a.destinationCountry ? ` · ${a.destinationCountry}` : ""}
            {a.documentType ? ` · ${a.documentType}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xs text-white/55">{a.displayId}</div>
          <div className="mt-1 text-2xl font-semibold text-white/90">{relativeAge(a.ageHours)}</div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-white/40">
            {a.basis === "stage_entry" ? "in stage" : "no activity"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-1.5 text-xs text-white/60">
        <div>
          <span className="text-white/45">Reason:</span> {a.reason}
        </div>
        <div>
          <span className="text-white/45">Next action:</span> {a.nextAction}
        </div>
        {a.stageSince ? (
          <div>
            <span className="text-white/45">Overdue since:</span>{" "}
            {new Date(a.stageSince).toLocaleString()} <span className="text-white/35">({a.basisField})</span>
          </div>
        ) : null}
      </div>

      <Link
        href={a.href}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/20 px-3.5 py-2 text-xs font-medium transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        Open Matter →
      </Link>
    </article>
  );
}
