"use client";

import { AlertOctagon } from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.12)";
const SURFACE = "rgba(255,255,255,0.03)";

// ── Trigger types ──────────────────────────────────────────────────────────────
type ReviewTrigger =
  | "unclear_destination_country"
  | "unclear_document_origin"
  | "missing_signer_location"
  | "unknown_apostille_requirement"
  | "payment_reference_mismatch"
  | "packet_qa_failed"
  | "courier_mismatch"
  | "release_blocked";

type ReviewPriority = "urgent" | "standard" | "low";

interface ReviewItem {
  review_id: string;
  matter_id: string;
  trigger: ReviewTrigger;
  description: string;
  priority: ReviewPriority;
  flagged_at: string;
  flagged_by: string;
  resolved: boolean;
}

// ── Safe demo seed — clearly marked, no live data ─────────────────────────────
// const SEED_ITEMS: ReviewItem[] = [
//   {
//     review_id: "REV-0001",
//     matter_id: "MTR-0023",
//     trigger: "payment_reference_mismatch",
//     description: "Wise payment reference does not match matter ID. Confirm before release.",
//     priority: "urgent",
//     flagged_at: "2026-06-10T14:22:00Z",
//     flagged_by: "system",
//     resolved: false,
//   },
// ];

const ITEMS: ReviewItem[] = []; // Empty state — no pending review items

// ── Trigger display labels ─────────────────────────────────────────────────────
const TRIGGER_LABEL: Record<ReviewTrigger, string> = {
  unclear_destination_country: "Unclear Destination Country",
  unclear_document_origin: "Unclear Document Origin",
  missing_signer_location: "Missing Signer Location",
  unknown_apostille_requirement: "Unknown Apostille Requirement",
  payment_reference_mismatch: "Payment Reference Mismatch",
  packet_qa_failed: "Packet QA Failed",
  courier_mismatch: "Courier Mismatch",
  release_blocked: "Release Blocked",
};

const PRIORITY_COLOR: Record<ReviewPriority, string> = {
  urgent: "rgba(239,68,68,0.75)",
  standard: "rgba(212,175,55,0.65)",
  low: "rgba(255,255,255,0.3)",
};

const ALL_TRIGGERS = Object.keys(TRIGGER_LABEL) as ReviewTrigger[];

export default function NeedsReviewPage() {
  return (
    <div style={{ color: "#e8e4dc", fontFamily: "monospace" }}>
      {/* Header */}
      <div className="mb-6">
        <p style={{ fontSize: 9, letterSpacing: "0.25em", color: GOLD_DIM, marginBottom: 4 }}>
          OPERATOR CONTROL LAYER
        </p>
        <div className="flex items-center gap-3 mb-2">
          <AlertOctagon size={16} style={{ color: GOLD }} />
          <h1 style={{ fontSize: "clamp(1.1rem,2.5vw,1.5rem)", fontFamily: "Georgia,serif", fontWeight: "normal", color: "#f4e5b8" }}>
            Needs Review Queue
          </h1>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Items flagged for operator review. All routing guidance is authority-dependent.
          Do not release or schedule until resolved.
        </p>
      </div>

      {/* Trigger reference panel */}
      <div
        className="rounded-sm px-4 py-3 mb-6"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
      >
        <p style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.18em", marginBottom: 8 }}>REVIEW TRIGGERS</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4">
          {ALL_TRIGGERS.map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(212,175,55,0.3)", display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
                {TRIGGER_LABEL[t]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {ITEMS.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-sm"
          style={{ border: `1px solid ${BORDER}`, background: SURFACE }}
        >
          <AlertOctagon size={28} style={{ color: GOLD_DIM, marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
            No Items Require Review
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 6 }}>
            Flagged matters will appear here when a review trigger is activated
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ITEMS.filter((i) => !i.resolved).map((item) => (
            <div
              key={item.review_id}
              className="rounded-sm px-4 py-4"
              style={{ border: `1px solid rgba(239,68,68,0.18)`, background: "rgba(239,68,68,0.03)" }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontSize: 11, color: "#f4e5b8" }}>{item.review_id}</span>
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>·</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{item.matter_id}</span>
                  </div>
                  <span style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.18em" }}>
                    {TRIGGER_LABEL[item.trigger].toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 8, color: PRIORITY_COLOR[item.priority], letterSpacing: "0.18em" }}>
                    {item.priority.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                    {item.flagged_at}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                {item.description}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
                  FLAGGED BY: {item.flagged_by.toUpperCase()} · CONFIRM BEFORE RELEASE
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-2">
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em" }}>
          {ITEMS.length} ITEMS IN QUEUE · OPERATOR REVIEW REQUIRED · DO NOT RELEASE UNRESOLVED
        </span>
        <span style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.15em" }}>
          THE MILANO SEAL™
        </span>
      </div>
    </div>
  );
}
