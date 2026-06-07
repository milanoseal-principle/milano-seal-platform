"use client";
import { QAStatusBadge } from "./QAStatusBadge";
import type { QAStatus } from "@/lib/execution-qa/status";

interface QACardProps {
  matterId: string;
  clientName?: string;
  destination?: string;
  documentType?: string;
  executionType?: string;
  qaStatus: QAStatus;
  missingItems?: string[];
  onPass?: () => void;
  onBlock?: () => void;
  onEscalate?: () => void;
}

export function ExecutionQACard({ matterId, clientName, destination, documentType, qaStatus, missingItems, onPass, onBlock, onEscalate }: QACardProps) {
  return (
    <div className="rounded border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(212,175,55,0.12)" }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(212,175,55,0.45)" }}>
            {matterId.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-white font-medium text-sm">{clientName ?? "—"}</p>
          <p className="font-mono text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {documentType ?? "—"} · {destination ?? "—"}
          </p>
        </div>
        <QAStatusBadge status={qaStatus} />
      </div>

      {missingItems && missingItems.length > 0 && (
        <div className="mb-4">
          <p className="font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: "#f59e0b" }}>Missing Items</p>
          <ul className="space-y-1">
            {missingItems.map(item => (
              <li key={item} className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>· {item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {onPass && (
          <button onClick={onPass} className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded transition-colors"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
            Pass QA
          </button>
        )}
        {onBlock && (
          <button onClick={onBlock} className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded transition-colors"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            Block
          </button>
        )}
        {onEscalate && (
          <button onClick={onEscalate} className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded transition-colors"
            style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: "#D4AF37" }}>
            Escalate
          </button>
        )}
      </div>
    </div>
  );
}
