"use client";

import { useEffect, useState } from "react";
import type { ReadinessResult } from "@/lib/intelligence/executionReadiness";

interface Props {
  matterId: string;
}

const VERDICT_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  READY: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" },
  BLOCKED: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  REVIEW_REQUIRED: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  MISSING_INFO: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  ESCALATE_TO_NICHOLAS: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
};

export function ExecutionReadinessPanel({ matterId }: Props) {
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/readiness/${matterId}`)
      .then(r => r.json())
      .then(data => { setResult(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matterId]);

  if (loading) {
    return (
      <div className="rounded-lg p-4 animate-pulse" style={{ background: "rgba(6,4,2,0.98)", border: "1px solid rgba(212,175,55,0.15)" }}>
        <div className="h-4 w-24 rounded mb-3" style={{ background: "rgba(212,175,55,0.1)" }} />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-3 rounded" style={{ background: "rgba(212,175,55,0.07)", width: `${60 + i * 8}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const vs = VERDICT_STYLE[result.verdict] ?? VERDICT_STYLE.REVIEW_REQUIRED;

  return (
    <div className="rounded-lg p-4 space-y-4" style={{ background: "rgba(6,4,2,0.98)", border: "1px solid rgba(212,175,55,0.15)" }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.6)" }}>
          Execution Readiness
        </span>
        <span
          className="font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-full"
          style={{ color: vs.color, background: vs.bg, border: `1px solid ${vs.border}` }}
        >
          {result.verdict.replace(/_/g, " ")}
        </span>
      </div>

      <div className="space-y-1.5">
        {result.checks.map(check => (
          <div key={check.id} className="flex items-start gap-2">
            <span className="mt-0.5 text-xs" style={{ color: check.passed ? "#22c55e" : "#ef4444" }}>
              {check.passed ? "✓" : "✗"}
            </span>
            <div>
              <span className="font-mono text-[10px] tracking-wide" style={{ color: check.passed ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }}>
                {check.label}
              </span>
              {!check.passed && check.reason && (
                <p className="font-mono text-[9px] mt-0.5" style={{ color: "rgba(239,68,68,0.7)" }}>{check.reason}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {result.blockers.length > 0 && (
        <div className="rounded p-3 space-y-1" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(239,68,68,0.7)" }}>Blockers</p>
          {result.blockers.map((b, i) => (
            <p key={i} className="font-mono text-[10px]" style={{ color: "rgba(239,68,68,0.9)" }}>— {b}</p>
          ))}
        </div>
      )}
    </div>
  );
}
