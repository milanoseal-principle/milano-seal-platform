"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, MapPin, FileText, Clock } from "lucide-react";

interface AssignmentDetail {
  assignment_id: string;
  deal_ref: string | null;
  document_type: string | null;
  destination_country: string | null;
  origin_state: string | null;
  stage_label: string;
  assignment_status: string;
  dispatch_confirmed: boolean;
  scheduled_at: string | null;
  created_at: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function AllianceJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAssignment = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch("/api/alliance/jobs");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const found = (data.jobs ?? []).find(
        (j: AssignmentDetail) => j.assignment_id === assignmentId,
      );
      if (!found) {
        setIsError(true);
      } else {
        setAssignment(found);
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  async function performAction(action: "accept" | "decline" | "complete") {
    if (!assignment || actionPending) return;
    setActionPending(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/alliance/jobs/${assignmentId}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error ?? "Action failed.");
        return;
      }
      if (action === "decline") {
        router.push("/alliance/jobs");
        return;
      }
      // Refresh local state from API response
      setAssignment((prev) =>
        prev ? { ...prev, assignment_status: data.assignment?.assignment_status ?? prev.assignment_status } : prev,
      );
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setActionPending(false);
    }
  }

  const status = assignment?.assignment_status ?? "offered";
  const isOffered = status === "offered";
  const isAccepted = status === "accepted";
  const isInProgress = status === "in_progress";
  const isCompleted = status === "completed";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/alliance/jobs" className="ap-btn ghost text-xs inline-flex items-center gap-1.5">
        <ArrowLeft size={12} />
        Back to Queue
      </Link>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ap-card">
              <div className="ap-card-body space-y-2">
                <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
                <div className="h-6 bg-gray-100 rounded w-48 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="ap-card ap-card-body flex items-center gap-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <div className="text-sm text-gray-600">
            Assignment not found or access denied.{" "}
            <Link href="/alliance/jobs" className="text-amber-700 underline">
              Return to queue.
            </Link>
          </div>
        </div>
      )}

      {assignment && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="space-y-6"
        >
          {/* Header card */}
          <div className="ap-card ap-card-body">
            <div className="ap-eyebrow">Operation File</div>
            <h1
              className="text-2xl font-semibold text-gray-900 mt-1"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {assignment.deal_ref ?? assignmentId.slice(0, 8).toUpperCase()}
            </h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {isOffered && <span className="ap-pill blue">Offered</span>}
              {isAccepted && <span className="ap-pill green">Accepted</span>}
              {isInProgress && <span className="ap-pill purple">In Progress</span>}
              {isCompleted && <span className="ap-pill green">Completed</span>}
              {assignment.dispatch_confirmed && (
                <span className="ap-pill gray">Dispatched</span>
              )}
            </div>
          </div>

          {/* Assignment details — partner-safe only */}
          <div className="ap-card">
            <div className="ap-card-header">
              <h3 className="ap-card-title">Assignment Details</h3>
            </div>
            <div className="ap-card-body space-y-0">
              {assignment.document_type && (
                <div className="ap-kv">
                  <span className="ap-kv-k flex items-center gap-1.5">
                    <FileText size={11} />
                    Document Type
                  </span>
                  <span className="ap-kv-v">{assignment.document_type}</span>
                </div>
              )}
              <div className="ap-kv">
                <span className="ap-kv-k flex items-center gap-1.5">
                  <MapPin size={11} />
                  Route
                </span>
                <span className="ap-kv-v">
                  {assignment.origin_state ?? "—"}
                  {assignment.destination_country && (
                    <> → {assignment.destination_country}</>
                  )}
                </span>
              </div>
              <div className="ap-kv">
                <span className="ap-kv-k">Matter Stage</span>
                <span className="ap-kv-v">{assignment.stage_label}</span>
              </div>
              {assignment.scheduled_at && (
                <div className="ap-kv">
                  <span className="ap-kv-k flex items-center gap-1.5">
                    <Clock size={11} />
                    Scheduled
                  </span>
                  <span className="ap-kv-v font-mono">
                    {new Date(assignment.scheduled_at).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              <div className="ap-kv">
                <span className="ap-kv-k">Assignment ID</span>
                <span className="ap-kv-v font-mono text-xs text-gray-400">
                  {assignmentId.slice(0, 16)}…
                </span>
              </div>
            </div>
          </div>

          {/* Instructions — shown for active assignments */}
          {(isAccepted || isInProgress || isOffered) && (
            <div className="ap-card ap-card-body">
              <div className="ap-eyebrow">Execution Protocol</div>
              <p className="text-sm text-gray-600 leading-relaxed mt-2">
                Verify all signer identity documentation before proceeding. Transmit executed documents only through the secure upload channel. Apostille and authentication requirements vary by destination — contact your Milano Seal coordinator for destination-specific guidance. Do not share client information or document contents through unsecured channels.
              </p>
            </div>
          )}

          {/* Error feedback */}
          {actionError && (
            <div
              className="ap-card ap-card-body flex items-center gap-2.5"
              style={{ borderColor: "rgba(239,68,68,0.3)" }}
            >
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span className="text-sm text-red-600">{actionError}</span>
            </div>
          )}

          {/* Accept / Decline — offered state */}
          {isOffered && (
            <div className="ap-card ap-card-body flex gap-3">
              <button
                onClick={() => performAction("accept")}
                disabled={actionPending}
                className="ap-btn accept flex-1 justify-center disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                {actionPending ? "Processing…" : "Accept Assignment"}
              </button>
              <button
                onClick={() => performAction("decline")}
                disabled={actionPending}
                className="ap-btn decline flex-1 justify-center disabled:opacity-50"
              >
                {actionPending ? "Processing…" : "Decline"}
              </button>
            </div>
          )}

          {/* Completion upload — accepted / in_progress state */}
          {(isAccepted || isInProgress) && (
            <div className="ap-card">
              <div className="ap-card-header">
                <h3 className="ap-card-title">Completion Upload</h3>
              </div>
              <div className="ap-card-body">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center mb-4">
                  <Upload size={24} className="mx-auto mb-2 text-gray-300" />
                  <div className="text-sm text-gray-500 mb-1">
                    Upload executed document files
                  </div>
                  <div className="text-xs text-gray-400">
                    PDF, PNG, JPG — Max 25 MB — Secure upload active on account approval
                  </div>
                </div>
                <button
                  onClick={() => performAction("complete")}
                  disabled={actionPending}
                  className="ap-btn primary w-full justify-center disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  {actionPending ? "Processing…" : "Signal Execution Complete"}
                </button>
              </div>
            </div>
          )}

          {/* Completed state */}
          {isCompleted && (
            <div
              className="ap-card ap-card-body flex items-center gap-3"
              style={{ borderColor: "rgba(16,185,129,0.3)" }}
            >
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              <div>
                <div className="font-semibold text-gray-900">Assignment Complete</div>
                <div className="text-sm text-gray-500">
                  Payout will be reflected in your commission ledger upon Milano Seal
                  review and confirmation.
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
