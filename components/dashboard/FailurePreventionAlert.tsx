"use client";

import { useEffect, useState } from "react";
import type { FailureCheckResult } from "@/lib/intelligence/failurePrevention";

interface Props {
  matterId: string;
}

<<<<<<< HEAD
type Severity = "INFO" | "WARNING" | "STOP";

function severityIcon(severity: Severity): string {
  switch (severity) {
    case "STOP":
      return "⛔";
    case "WARNING":
      return "⚠";
    case "INFO":
      return "ℹ";
  }
}

function severityClass(severity: Severity): string {
  switch (severity) {
    case "STOP":
      return "border-red-700 bg-red-950/60 text-red-300";
    case "WARNING":
      return "border-amber-600 bg-amber-950/60 text-amber-300";
    case "INFO":
      return "border-yellow-600 bg-yellow-950/40 text-yellow-300";
  }
}

function severityLabelClass(severity: Severity): string {
  switch (severity) {
    case "STOP":
      return "text-red-400";
    case "WARNING":
      return "text-amber-400";
    case "INFO":
      return "text-yellow-400";
  }
}

export default function FailurePreventionAlert({ matterId }: Props) {
  const [data, setData] = useState<FailureCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/failure-check/${matterId}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [matterId]);

  if (loading || !data || !data.matched) return null;

  return (
    <div className="rounded-lg border border-amber-700 bg-neutral-950 p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-amber-400 text-base">⚠</span>
        <h2 className="text-[#c9a84c] font-mono text-sm uppercase tracking-widest font-semibold">
          Failure Prevention Engine
        </h2>
      </div>

      {/* Pattern list */}
      <ul className="space-y-2">
        {data.patterns.map((pattern) => (
          <li
            key={pattern.id}
            className={`flex items-start gap-3 rounded border px-3 py-2.5 ${severityClass(pattern.severity as Severity)}`}
          >
            <span className="text-sm select-none shrink-0 mt-0.5">
              {severityIcon(pattern.severity as Severity)}
            </span>
            <div className="flex-1 min-w-0">
              <span className={`font-mono text-xs font-bold uppercase tracking-wide mr-2 ${severityLabelClass(pattern.severity as Severity)}`}>
                {pattern.severity}
              </span>
              <span className="font-mono text-xs">{pattern.warning}</span>
            </div>
          </li>
        ))}
      </ul>
=======
export function FailurePreventionAlert({ matterId }: Props) {
  const [result, setResult] = useState<FailureCheckResult | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/failure-check/${matterId}`)
      .then(r => r.json())
      .then(setResult)
      .catch(() => {});
  }, [matterId]);

  if (!result || !result.matched) return null;

  return (
    <div className="rounded-lg p-4 space-y-3" style={{ background: "rgba(6,4,2,0.98)", border: "1px solid rgba(245,158,11,0.4)" }}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs tracking-widest uppercase font-bold" style={{ color: "#f59e0b" }}>
          Stop.
        </span>
        {result.message && (
          <span className="font-mono text-[10px]" style={{ color: "rgba(245,158,11,0.8)" }}>{result.message}</span>
        )}
      </div>
      <div className="space-y-2">
        {result.patterns.map(p => (
          <div key={p.id} className="rounded p-2.5 space-y-0.5" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
            <p className="font-mono text-[10px] tracking-wide font-semibold" style={{ color: "#f59e0b" }}>{p.label}</p>
            <p className="font-mono text-[9px]" style={{ color: "rgba(245,158,11,0.7)" }}>{p.description}</p>
          </div>
        ))}
      </div>
>>>>>>> claude/funny-maxwell-hlxQN
    </div>
  );
}
