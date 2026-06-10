"use client";

import { AlertTriangle, Clock, CheckCircle2, XCircle, ChevronRight, Package, Truck, CreditCard } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

export type MatterState =
  | "intake_received"
  | "under_review"
  | "awaiting_payment"
  | "scheduled"
  | "in_execution"
  | "apostille_processing"
  | "in_transit"
  | "delivered"
  | "completed";

export interface ContextItem {
  matter_id: string;
  client_name: string;
  document_type: string;
  destination_country: string;
  current_state: MatterState;
  payment_status: "pending" | "confirmed" | "failed";
  payment_confirmed: boolean;
  packet_flags: string[];
  courier_status: "not_shipped" | "in_transit" | "delivered" | "n_a";
  tracking_number: string | null;
  next_safe_action: string;
  risk_flag: string | null;
  assigned_operator: string;
  updated_at: string;
}

interface ContextStreamProps {
  items: ContextItem[];
  onSelect?: (matter_id: string) => void;
  selectedId?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATE_LABEL: Record<MatterState, string> = {
  intake_received: "Intake",
  under_review: "Under Review",
  awaiting_payment: "Awaiting Payment",
  scheduled: "Scheduled",
  in_execution: "In Execution",
  apostille_processing: "Apostille",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
};

const STATE_COLOR: Record<MatterState, string> = {
  intake_received: "rgba(212,175,55,0.6)",
  under_review: "rgba(212,175,55,0.8)",
  awaiting_payment: "rgba(239,68,68,0.75)",
  scheduled: "rgba(34,197,94,0.65)",
  in_execution: "rgba(34,197,94,0.85)",
  apostille_processing: "rgba(99,102,241,0.75)",
  in_transit: "rgba(59,130,246,0.75)",
  delivered: "rgba(34,197,94,0.75)",
  completed: "rgba(212,175,55,0.9)",
};

function priorityOf(item: ContextItem): number {
  if (item.risk_flag) return 0;
  if (item.packet_flags.length > 0) return 1;
  if (!item.payment_confirmed && item.current_state !== "awaiting_payment") return 2;
  if (item.courier_status === "in_transit") return 3;
  return 4;
}

const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.1)";
const SURFACE = "rgba(255,255,255,0.025)";

// ── Component ──────────────────────────────────────────────────────────────────

export function ContextStream({ items, onSelect, selectedId }: ContextStreamProps) {
  const sorted = [...items].sort((a, b) => priorityOf(a) - priorityOf(b));

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
        <CheckCircle2 size={28} style={{ color: "rgba(212,175,55,0.2)", marginBottom: 10 }} />
        <div style={{ fontSize: 11, letterSpacing: "0.2em", fontFamily: "monospace" }}>NO VA ACTIONS PENDING</div>
        <div style={{ fontSize: 10, marginTop: 6, color: "rgba(255,255,255,0.15)" }}>All matters are current.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div style={{ fontSize: 8, letterSpacing: "0.25em", color: GOLD_DIM, fontFamily: "monospace", marginBottom: 4 }}>
        CONTEXT STREAM · {sorted.length} ITEM{sorted.length !== 1 ? "S" : ""} REQUIRE ATTENTION
      </div>

      {sorted.map((item) => {
        const isSelected = selectedId === item.matter_id;
        const hasRisk = !!item.risk_flag;
        const hasFlags = item.packet_flags.length > 0;
        const paymentPending = !item.payment_confirmed;

        return (
          <button
            key={item.matter_id}
            onClick={() => onSelect?.(item.matter_id)}
            className="w-full text-left rounded-sm p-3 transition-colors"
            style={{
              background: isSelected ? "rgba(212,175,55,0.06)" : SURFACE,
              border: `1px solid ${isSelected ? "rgba(212,175,55,0.3)" : hasRisk ? "rgba(239,68,68,0.2)" : BORDER}`,
            }}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {hasRisk && <AlertTriangle size={11} style={{ color: "rgba(239,68,68,0.75)", flexShrink: 0 }} />}
                {!hasRisk && hasFlags && <Package size={11} style={{ color: "rgba(245,158,11,0.7)", flexShrink: 0 }} />}
                {!hasRisk && !hasFlags && item.courier_status === "in_transit" && (
                  <Truck size={11} style={{ color: "rgba(59,130,246,0.7)", flexShrink: 0 }} />
                )}
                {!hasRisk && !hasFlags && item.courier_status !== "in_transit" && (
                  <Clock size={11} style={{ color: GOLD_DIM, flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 10, color: GOLD, letterSpacing: "0.05em", fontFamily: "monospace" }}>
                  {item.matter_id}
                </span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{item.client_name}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATE_COLOR[item.current_state] }} />
                <span style={{ fontSize: 8, color: STATE_COLOR[item.current_state], letterSpacing: "0.1em", fontFamily: "monospace" }}>
                  {STATE_LABEL[item.current_state]}
                </span>
              </div>
            </div>

            {/* Middle row */}
            <div className="flex items-center gap-3 mb-2">
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>{item.document_type}</span>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>→</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>{item.destination_country}</span>
            </div>

            {/* Payment gate */}
            {paymentPending && (
              <div className="flex items-center gap-1.5 mb-2">
                <CreditCard size={10} style={{ color: "rgba(239,68,68,0.6)" }} />
                <span style={{ fontSize: 8, color: "rgba(239,68,68,0.6)", letterSpacing: "0.1em", fontFamily: "monospace" }}>
                  PAYMENT REQUIRED — VA ACTION LIMITED
                </span>
              </div>
            )}
            {!paymentPending && (
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={10} style={{ color: "rgba(34,197,94,0.55)" }} />
                <span style={{ fontSize: 8, color: "rgba(34,197,94,0.55)", letterSpacing: "0.1em", fontFamily: "monospace" }}>
                  PAYMENT CONFIRMED — OPERATOR ACTION MAY PROCEED
                </span>
              </div>
            )}

            {/* Packet flags */}
            {hasFlags && (
              <div className="flex flex-wrap gap-1 mb-2">
                {item.packet_flags.map((f) => (
                  <span key={f} className="px-1 py-0.5 rounded-sm"
                    style={{ fontSize: 7, background: "rgba(239,68,68,0.07)", color: "rgba(239,68,68,0.65)", border: "1px solid rgba(239,68,68,0.15)", letterSpacing: "0.08em", fontFamily: "monospace" }}>
                    {f.replace(/_/g, " ").toUpperCase()}
                  </span>
                ))}
              </div>
            )}

            {/* Risk flag */}
            {hasRisk && (
              <div className="mb-2" style={{ fontSize: 9, color: "rgba(239,68,68,0.7)" }}>
                ⚠ {item.risk_flag}
              </div>
            )}

            {/* Next safe action */}
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                Next: <span style={{ color: "rgba(255,255,255,0.55)" }}>{item.next_safe_action}</span>
              </span>
              <ChevronRight size={11} style={{ color: isSelected ? GOLD : GOLD_DIM }} />
            </div>

            {/* Tracking */}
            {item.tracking_number && (
              <div style={{ fontSize: 8, color: "rgba(59,130,246,0.5)", marginTop: 4, fontFamily: "monospace" }}>
                {item.tracking_number}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
