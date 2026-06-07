"use client";
import { useEffect, useState } from "react";
import { ExecutionQACard } from "./ExecutionQACard";
import { QAStatusBadge } from "./QAStatusBadge";
import type { QAStatus } from "@/lib/execution-qa/status";

interface QAReview {
  id: string;
  deal_id: string;
  execution_qa_status: QAStatus;
  scanback_status: string;
  witness_status: string;
  checklist_type: string;
  missing_items?: string[];
  blocking_items?: string[];
  created_at: string;
}

export function ExecutionQADesk() {
  const [reviews, setReviews] = useState<QAReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/execution-qa")
      .then(r => r.json())
      .then(d => setReviews(d.reviews ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = {
    BLOCKED: reviews.filter(r => r.execution_qa_status === "BLOCKED"),
    REVIEW_REQUIRED: reviews.filter(r => r.execution_qa_status === "REVIEW_REQUIRED"),
    IN_REVIEW: reviews.filter(r => r.execution_qa_status === "IN_REVIEW"),
    NOT_STARTED: reviews.filter(r => r.execution_qa_status === "NOT_STARTED"),
    PASSED: reviews.filter(r => r.execution_qa_status === "PASSED"),
  };

  if (loading) return <p className="font-mono text-sm p-6" style={{ color: "rgba(255,255,255,0.3)" }}>Loading QA queue…</p>;

  if (reviews.length === 0) return (
    <div className="rounded border px-6 py-12 text-center" style={{ borderColor: "rgba(212,175,55,0.1)", background: "rgba(255,255,255,0.02)" }}>
      <p className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No QA reviews in queue.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {(["BLOCKED", "REVIEW_REQUIRED", "IN_REVIEW", "NOT_STARTED", "PASSED"] as QAStatus[]).map(status => {
        const items = grouped[status];
        if (items.length === 0) return null;
        return (
          <div key={status}>
            <div className="flex items-center gap-3 mb-3">
              <QAStatusBadge status={status} />
              <span className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{items.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map(r => (
                <ExecutionQACard
                  key={r.id}
                  matterId={r.deal_id}
                  qaStatus={r.execution_qa_status}
                  missingItems={r.missing_items}
                  onPass={async () => {
                    await fetch(`/api/dashboard/execution-qa/${r.deal_id}/pass`, { method: "POST" });
                    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, execution_qa_status: "PASSED" } : x));
                  }}
                  onBlock={async () => {
                    await fetch(`/api/dashboard/execution-qa/${r.deal_id}/block`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Blocked by operator" }) });
                    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, execution_qa_status: "BLOCKED" } : x));
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
