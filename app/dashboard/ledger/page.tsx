"use client";

import { ScrollText } from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.12)";
const SURFACE = "rgba(255,255,255,0.03)";

// ── Canonical event names ──────────────────────────────────────────────────────
type CanonicalEvent =
  | "SMART_REQUEST_PARSED"
  | "STRUCTURED_INTAKE_CREATED"
  | "MATTER_CREATED"
  | "COMPLIANCE_VERIFIED"
  | "LANE_ASSIGNED"
  | "INVOICE_CREATED"
  | "INVOICE_SENT"
  | "PAYMENT_CONFIRMED"
  | "SCHEDULING_UNLOCKED"
  | "EXECUTION_SCHEDULED"
  | "RON_COMPLETED"
  | "APOSTILLE_SUBMITTED"
  | "APOSTILLE_COMPLETED"
  | "COURIER_RELEASED"
  | "DELIVERY_CONFIRMED"
  | "PAID_AND_RELEASED";

type ActorRole = "operator" | "system" | "client" | "notary" | "courier" | "authority";

// ── State machine alignment ────────────────────────────────────────────────────
// intake_received → under_review → awaiting_payment → scheduled →
// in_execution → apostille_processing → in_transit → delivered → completed
type MatterStatus =
  | "intake_received"
  | "under_review"
  | "awaiting_payment"
  | "scheduled"
  | "in_execution"
  | "apostille_processing"
  | "in_transit"
  | "delivered"
  | "completed";

interface LedgerEvent {
  event_id: string;
  matter_id: string;
  actor: string;
  actor_role: ActorRole;
  event_name: CanonicalEvent;
  event_description: string;
  previous_status: MatterStatus | null;
  next_status: MatterStatus;
  reference: string;
  created_at: string;
}

// ── Safe empty state — no live data ───────────────────────────────────────────
// const SEED_EVENTS: LedgerEvent[] = [
//   {
//     event_id: "EVT-0001",
//     matter_id: "MTR-0001",
//     actor: "Nicholas Milano",
//     actor_role: "operator",
//     event_name: "MATTER_CREATED",
//     event_description: "Matter created from structured intake. Operator review initiated.",
//     previous_status: "intake_received",
//     next_status: "under_review",
//     reference: "INK-0001",
//     created_at: "2026-06-10T09:00:00Z",
//   },
// ];

const EVENTS: LedgerEvent[] = []; // Empty state — no events recorded

// ── Event color by lifecycle phase ────────────────────────────────────────────
const EVENT_PHASE_COLOR: Partial<Record<CanonicalEvent, string>> = {
  SMART_REQUEST_PARSED: "rgba(255,255,255,0.4)",
  STRUCTURED_INTAKE_CREATED: "rgba(255,255,255,0.4)",
  MATTER_CREATED: "rgba(212,175,55,0.6)",
  COMPLIANCE_VERIFIED: "rgba(212,175,55,0.6)",
  LANE_ASSIGNED: "rgba(212,175,55,0.6)",
  INVOICE_CREATED: "rgba(96,165,250,0.6)",
  INVOICE_SENT: "rgba(96,165,250,0.6)",
  PAYMENT_CONFIRMED: "rgba(34,197,94,0.7)",
  SCHEDULING_UNLOCKED: "rgba(34,197,94,0.6)",
  EXECUTION_SCHEDULED: "rgba(34,197,94,0.6)",
  RON_COMPLETED: "rgba(212,175,55,0.75)",
  APOSTILLE_SUBMITTED: "rgba(212,175,55,0.65)",
  APOSTILLE_COMPLETED: "rgba(212,175,55,0.75)",
  COURIER_RELEASED: "rgba(212,175,55,0.65)",
  DELIVERY_CONFIRMED: "rgba(34,197,94,0.7)",
  PAID_AND_RELEASED: "rgba(34,197,94,0.8)",
};

const ROLE_COLOR: Record<ActorRole, string> = {
  operator: "rgba(212,175,55,0.55)",
  system: "rgba(255,255,255,0.25)",
  client: "rgba(255,255,255,0.35)",
  notary: "rgba(96,165,250,0.5)",
  courier: "rgba(251,191,36,0.5)",
  authority: "rgba(239,68,68,0.45)",
};

const ALL_EVENTS: CanonicalEvent[] = [
  "SMART_REQUEST_PARSED", "STRUCTURED_INTAKE_CREATED", "MATTER_CREATED", "COMPLIANCE_VERIFIED",
  "LANE_ASSIGNED", "INVOICE_CREATED", "INVOICE_SENT", "PAYMENT_CONFIRMED",
  "SCHEDULING_UNLOCKED", "EXECUTION_SCHEDULED", "RON_COMPLETED", "APOSTILLE_SUBMITTED",
  "APOSTILLE_COMPLETED", "COURIER_RELEASED", "DELIVERY_CONFIRMED", "PAID_AND_RELEASED",
];

export default function LedgerPage() {
  return (
    <div style={{ color: "#e8e4dc", fontFamily: "monospace" }}>
      {/* Header */}
      <div className="mb-6">
        <p style={{ fontSize: 9, letterSpacing: "0.25em", color: GOLD_DIM, marginBottom: 4 }}>
          OPERATOR CONTROL LAYER
        </p>
        <div className="flex items-center gap-3 mb-2">
          <ScrollText size={16} style={{ color: GOLD }} />
          <h1 style={{ fontSize: "clamp(1.1rem,2.5vw,1.5rem)", fontFamily: "Georgia,serif", fontWeight: "normal", color: "#f4e5b8" }}>
            Operational Ledger
          </h1>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Immutable event log across all matters. State transitions are append-only.
          Operator verification required before any release operations.
        </p>
      </div>

      {/* Canonical event reference */}
      <div
        className="rounded-sm px-4 py-3 mb-6"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
      >
        <p style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.18em", marginBottom: 8 }}>
          CANONICAL EVENT NAMES
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {ALL_EVENTS.map((e) => (
            <span
              key={e}
              style={{
                fontSize: 8,
                color: EVENT_PHASE_COLOR[e] ?? "rgba(255,255,255,0.3)",
                letterSpacing: "0.1em",
              }}
            >
              {e}
            </span>
          ))}
        </div>
      </div>

      {EVENTS.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-sm"
          style={{ border: `1px solid ${BORDER}`, background: SURFACE }}
        >
          <ScrollText size={28} style={{ color: GOLD_DIM, marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
            No Events Recorded
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 6 }}>
            Events will appear here as matters move through the execution lifecycle
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm" style={{ border: `1px solid ${BORDER}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                {["Event ID", "Matter", "Actor", "Role", "Event", "Description", "Prev Status", "Next Status", "Reference", "Timestamp"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: 8,
                      letterSpacing: "0.18em",
                      color: GOLD_DIM,
                      fontWeight: "normal",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((evt) => (
                <tr
                  key={evt.event_id}
                  style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                  <td style={{ padding: "10px 12px", color: "#f4e5b8", whiteSpace: "nowrap" }}>{evt.event_id}</td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{evt.matter_id}</td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{evt.actor}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 8, color: ROLE_COLOR[evt.actor_role], letterSpacing: "0.12em" }}>
                      {evt.actor_role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 8, color: EVENT_PHASE_COLOR[evt.event_name] ?? GOLD_DIM, letterSpacing: "0.08em" }}>
                      {evt.event_name}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.35)", maxWidth: 200, fontSize: 9 }}>{evt.event_description}</td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", fontSize: 9 }}>{evt.previous_status ?? "—"}</td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", fontSize: 9 }}>{evt.next_status}</td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", fontSize: 9 }}>{evt.reference}</td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: 9 }}>{evt.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-2">
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em" }}>
          {EVENTS.length} EVENTS · APPEND-ONLY · OPERATOR REVIEW ONLY · NO DELETIONS
        </span>
        <span style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.15em" }}>
          THE MILANO SEAL™
        </span>
      </div>
    </div>
  );
}
