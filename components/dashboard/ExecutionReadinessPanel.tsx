"use client";

import { useEffect, useState } from "react";
<<<<<<< HEAD
import type { ReadinessResult, ReadinessVerdict } from "@/lib/intelligence/executionReadiness";
=======
import type { ReadinessResult } from "@/lib/intelligence/executionReadiness";
>>>>>>> claude/funny-maxwell-hlxQN

interface Props {
  matterId: string;
}

<<<<<<< HEAD
function verdictColor(verdict: ReadinessVerdict): string {
  switch (verdict) {
    case "READY":
      return "bg-green-700 text-green-100";
    case "BLOCKED":
      return "bg-red-700 text-red-100";
    case "ESCALATE_TO_NICHOLAS":
      return "bg-red-800 text-red-100";
    case "REVIEW_REQUIRED":
    case "MISSING_INFO":
      return "bg-amber-700 text-amber-100";
  }
}

function verdictLabel(verdict: ReadinessVerdict): string {
  switch (verdict) {
    case "READY":
      return "READY";
    case "BLOCKED":
      return "BLOCKED";
    case "ESCALATE_TO_NICHOLAS":
      return "ESCALATE TO NICHOLAS";
    case "REVIEW_REQUIRED":
      return "REVIEW REQUIRED";
    case "MISSING_INFO":
      return "MISSING INFO";
  }
}

function CheckIcon({ passed }: { passed: boolean }) {
  if (passed) {
    return (
      <span className="text-green-400 font-mono text-sm select-none">✓</span>
    );
  }
  return (
    <span className="text-red-400 font-mono text-sm select-none">✗</span>
  );
}

function Skeleton() {
  return (
    <div className="rounded-lg bg-neutral-900 border border-neutral-700 p-6 space-y-4 animate-pulse">
      <div className="h-5 bg-neutral-700 rounded w-48" />
      <div className="h-8 bg-neutral-700 rounded w-32" />
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-5 bg-neutral-800 rounded w-full" />
      ))}
    </div>
  );
}

export default function ExecutionReadinessPanel({ matterId }: Props) {
  const [data, setData] = useState<ReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
=======
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
>>>>>>> claude/funny-maxwell-hlxQN

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/readiness/${matterId}`)
<<<<<<< HEAD
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load readiness");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load execution readiness.");
        setLoading(false);
      });
  }, [matterId]);

  if (loading) return <Skeleton />;

  if (error || !data) {
    return (
      <div className="rounded-lg bg-neutral-900 border border-red-800 p-6">
        <p className="text-red-400 font-mono text-sm">{error ?? "Unknown error"}</p>
=======
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
>>>>>>> claude/funny-maxwell-hlxQN
      </div>
    );
  }

<<<<<<< HEAD
  return (
    <div className="rounded-lg bg-neutral-900 border border-neutral-700 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-[#c9a84c] font-mono text-sm uppercase tracking-widest font-semibold">
          Execution Readiness
        </h2>
        <span
          className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest ${verdictColor(data.verdict)}`}
        >
          {verdictLabel(data.verdict)}
        </span>
      </div>

      {/* Summary counts */}
      <div className="flex gap-4 text-xs font-mono text-neutral-400">
        {data.blockerCount > 0 && (
          <span className="text-red-400">{data.blockerCount} blocker{data.blockerCount !== 1 ? "s" : ""}</span>
        )}
        {data.reviewCount > 0 && (
          <span className="text-amber-400">{data.reviewCount} review{data.reviewCount !== 1 ? "s" : ""}</span>
        )}
        {data.missingCount > 0 && (
          <span className="text-amber-400">{data.missingCount} missing</span>
        )}
        {data.blockerCount === 0 && data.reviewCount === 0 && data.missingCount === 0 && (
          <span className="text-green-400">All checks passed</span>
        )}
      </div>

      {/* Checks list */}
      <ul className="space-y-2">
        {data.checks.map((check) => (
          <li
            key={check.id}
            className="flex items-start gap-3 border border-neutral-800 rounded px-3 py-2 bg-neutral-950"
          >
            <CheckIcon passed={check.passed} />
            <div className="flex-1 min-w-0">
              <span className="font-mono text-xs text-neutral-200 font-medium">
                {check.label}
              </span>
              {check.reason && (
                <p className="font-mono text-xs text-neutral-500 mt-0.5">
                  {check.reason}
                </p>
              )}
            </div>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 ${
                check.passed
                  ? "bg-green-900/40 text-green-400"
                  : check.verdict === "BLOCKED"
                  ? "bg-red-900/40 text-red-400"
                  : "bg-amber-900/40 text-amber-400"
              }`}
            >
              {check.verdict}
            </span>
          </li>
        ))}
      </ul>

      <p className="font-mono text-xs text-neutral-600">
        Evaluated: {new Date(data.evaluatedAt).toLocaleString()}
      </p>
=======
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
>>>>>>> claude/funny-maxwell-hlxQN
    </div>
  );
}
