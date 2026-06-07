"use client";
import { useState } from "react";
import { getChecklist, type ChecklistType } from "@/lib/execution-qa/checklists";

export function ScanBackReviewChecklist({ type, onComplete }: { type: ChecklistType; onComplete?: (allPassed: boolean) => void }) {
  const items = getChecklist(type);
  const [state, setState] = useState<Record<string, "pending" | "passed" | "failed" | "na">>(() =>
    Object.fromEntries(items.map(i => [i.key, "pending"]))
  );

  const allRequired = items.filter(i => i.required).every(i => state[i.key] === "passed" || state[i.key] === "na");
  const anyFailed = items.some(i => state[i.key] === "failed");

  function setItemStatus(key: string, status: "passed" | "failed" | "na") {
    setState(s => { const n = { ...s, [key]: status }; return n; });
  }

  return (
    <div>
      <div className="space-y-2 mb-6">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between px-4 py-3 rounded border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: state[item.key] === "passed" ? "rgba(34,197,94,0.2)" : state[item.key] === "failed" ? "rgba(239,68,68,0.2)" : "rgba(212,175,55,0.1)" }}>
            <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>
              {item.required ? "* " : ""}{item.label}
            </span>
            <div className="flex gap-1.5">
              {(["passed", "failed", "na"] as const).map(s => (
                <button key={s} onClick={() => setItemStatus(item.key, s)}
                  className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded transition-colors"
                  style={{
                    background: state[item.key] === s ? (s === "passed" ? "rgba(34,197,94,0.2)" : s === "failed" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)") : "transparent",
                    border: `1px solid ${state[item.key] === s ? (s === "passed" ? "rgba(34,197,94,0.5)" : s === "failed" ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.2)") : "rgba(255,255,255,0.08)"}`,
                    color: state[item.key] === s ? (s === "passed" ? "#22c55e" : s === "failed" ? "#ef4444" : "rgba(255,255,255,0.5)") : "rgba(255,255,255,0.3)",
                  }}>
                  {s === "na" ? "N/A" : s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onComplete?.(allRequired && !anyFailed)}
        disabled={items.some(i => i.required && state[i.key] === "pending")}
        className="w-full font-mono text-[11px] tracking-widest uppercase py-3 rounded transition-colors disabled:opacity-40"
        style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37" }}>
        {anyFailed ? "Submit — Review Required" : allRequired ? "Submit — Pass QA" : "Complete All Required Items"}
      </button>
    </div>
  );
}
