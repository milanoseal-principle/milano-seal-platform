"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Summary = { status: "READY" | "REVIEW_REQUIRED" | "BLOCKED"; blockers: string[]; warnings: string[]; recommendedOperatorActions: string[] };

const TONE: Record<Summary["status"], string> = {
  READY: "border-[#C6A65B]/35 text-[#C6A65B]",
  REVIEW_REQUIRED: "border-amber-300/30 text-amber-200",
  BLOCKED: "border-[#E0876E]/40 text-[#E0876E]",
};

// Execution intelligence status inside the existing Matter 360 workspace;
// the full sections live on the Matter's Execution Readiness surface.
export function ExecutionIntelligenceStatusCard({ matterId }: { matterId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/dashboard/matters/${encodeURIComponent(matterId)}/execution-intelligence`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((body: { intelligence: Summary }) => active && setSummary(body.intelligence))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [matterId]);

  return (
    <Link
      href={`/dashboard/matters/${encodeURIComponent(matterId)}/execution`}
      className="block rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-5 transition hover:border-[#C6A65B]/30"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-[#C6A65B]">Execution Intelligence</span>
        {summary && (
          <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${TONE[summary.status]}`}>
            {summary.status.replaceAll("_", " ")}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-[#F6F1E6]/80">
        {failed
          ? "Execution intelligence is unavailable."
          : !summary
            ? "Loading execution intelligence…"
            : `${summary.blockers.length} blocker(s) · ${summary.warnings.length} review item(s)`}
      </p>
      {summary?.recommendedOperatorActions[0] && (
        <p className="mt-1 text-xs text-white/50">Next: {summary.recommendedOperatorActions[0]}</p>
      )}
    </Link>
  );
}
