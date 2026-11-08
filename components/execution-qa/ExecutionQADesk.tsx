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
  const [witnessForm, setWitnessForm] = useState<Record<string, { sessionId: string; evidenceReference: string }>>({});
  const [witnessBusy, setWitnessBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function completeWitness(review: QAReview) {
    const input = witnessForm[review.id] ?? { sessionId: "", evidenceReference: "" };
    setActionError(null);
    setWitnessBusy(review.id);
    try {
      const response = await fetch(`/api/dashboard/execution-qa/${review.deal_id}/witness-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, ...input }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setActionError(`Witness verification was not saved: ${data.code ?? "REVIEW_REQUIRED"}`);
        return;
      }
      setReviews(prev => prev.map(x => x.id === review.id ? { ...x, witness_status: "COMPLETE" } : x));
    } catch {
      setActionError("Witness verification is unavailable. Existing QA evidence was not marked complete.");
    } finally {
      setWitnessBusy(null);
    }
  }

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
      {actionError && <p role="alert" className="text-sm text-rose-300">{actionError}</p>}
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
                <div key={r.id} className="space-y-3">
                  <ExecutionQACard
                    matterId={r.deal_id}
                    qaStatus={r.execution_qa_status}
                    missingItems={r.missing_items}
                    onPass={async () => {
                      setActionError(null);
                      const response = await fetch(`/api/dashboard/execution-qa/${r.deal_id}/pass`, { method: "POST" });
                      if (!response.ok) { setActionError("QA approval failed. No completion is confirmed."); return; }
                      setReviews(prev => prev.map(x => x.id === r.id ? { ...x, execution_qa_status: "PASSED" } : x));
                    }}
                    onBlock={async () => {
                      setActionError(null);
                      const response = await fetch(`/api/dashboard/execution-qa/${r.deal_id}/block`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Blocked by operator" }) });
                      if (!response.ok) { setActionError("QA blocking action could not be saved."); return; }
                      setReviews(prev => prev.map(x => x.id === r.id ? { ...x, execution_qa_status: "BLOCKED" } : x));
                    }}
                  />
                  {r.checklist_type === "RON_QA" && r.witness_status !== "COMPLETE" && r.execution_qa_status !== "PASSED" && (
                    <form className="rounded border border-amber-500/20 p-3 space-y-2" onSubmit={e => { e.preventDefault(); void completeWitness(r); }}>
                      <p className="text-xs text-amber-200">Witness-required RON only. This verifies existing witness records; it cannot create or waive witness evidence.</p>
                      <label className="block text-xs">RON session ID
                        <input required type="text" aria-label="RON session ID" className="mt-1 w-full rounded bg-black/40 p-2 text-white" value={witnessForm[r.id]?.sessionId ?? ""}
                          onChange={e => setWitnessForm(prev => ({ ...prev, [r.id]: { ...prev[r.id], sessionId: e.target.value, evidenceReference: prev[r.id]?.evidenceReference ?? "" } }))}/>
                      </label>
                      <label className="block text-xs">Verified witness evidence reference
                        <input required type="text" aria-label="Verified witness evidence reference" className="mt-1 w-full rounded bg-black/40 p-2 text-white" value={witnessForm[r.id]?.evidenceReference ?? ""}
                          onChange={e => setWitnessForm(prev => ({ ...prev, [r.id]: { ...prev[r.id], sessionId: prev[r.id]?.sessionId ?? "", evidenceReference: e.target.value } }))}/>
                      </label>
                      <button disabled={witnessBusy !== null} type="submit" className="rounded border border-amber-400/40 px-3 py-2 text-xs text-amber-100 disabled:opacity-50">
                        {witnessBusy === r.id ? "Verifying witness records…" : "Verify and complete witness QA"}
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
