"use client";
import { QA_STATUS_LABELS, QA_STATUS_COLOR, type QAStatus } from "@/lib/execution-qa/status";

export function QAStatusBadge({ status }: { status: QAStatus }) {
  return (
    <span
      className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full"
      style={{
        color: QA_STATUS_COLOR[status],
        border: `1px solid ${QA_STATUS_COLOR[status]}44`,
        background: `${QA_STATUS_COLOR[status]}18`,
      }}
    >
      {QA_STATUS_LABELS[status]}
    </span>
  );
}
