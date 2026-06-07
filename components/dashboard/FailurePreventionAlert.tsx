"use client";

import { useEffect, useState } from "react";
import type { FailureCheckResult } from "@/lib/intelligence/failurePrevention";

interface Props {
  matterId: string;
}

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
    </div>
  );
}
