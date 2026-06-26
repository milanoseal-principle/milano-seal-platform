"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PortalClientMatter } from "@/components/portal/portal-context";

// ── Stage definitions ─────────────────────────────────────────────────────────

interface Stage {
  id: string;
  label: string;
}

const STAGES: Stage[] = [
  { id: "intake",    label: "Intake" },
  { id: "review",   label: "Review" },
  { id: "payment",  label: "Payment" },
  { id: "execution",label: "Execution" },
  { id: "apostille",label: "Apostille" },
  { id: "transit",  label: "Transit" },
  { id: "released", label: "Released" },
];

const STATUS_ORDER = [
  "new",
  "intake_received",
  "under_review",
  "compliance_review",
  "needs_info",
  "compliance_blocked",
  "quoted",
  "awaiting_payment",
  "payment_confirmed",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "courier_ready",
  "shipped",
  "delivered",
  "completed",
  "closed",
];

function statusRank(status: string | null | undefined): number {
  if (!status) return 0;
  const i = STATUS_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}

function resolveStageCompletion(deal: PortalClientMatter): number {
  // Returns the index of the CURRENT active stage (0-based)
  const status = deal.matter_status ?? "";
  const rank = statusRank(status);
  const paymentPaid =
    deal.payment_status === "paid" ||
    deal.payment_status === "confirmed" ||
    deal.payment_status === "payment_confirmed";
  const released =
    deal.is_paid_and_released ||
    status === "delivered" ||
    status === "completed" ||
    status === "closed";

  if (released) return 6;
  if (status === "shipped") return 5;
  if (status === "apostille_processing" || status === "courier_ready") return 4;
  if (status === "in_execution" || status === "scheduled") return 3;
  if (paymentPaid || status === "payment_confirmed") return 2;
  if (rank >= statusRank("under_review")) return 1;
  return 0; // intake
}

// ── Colors ────────────────────────────────────────────────────────────────────

const GOLD = "var(--ms-gold)";
const GOLD_MID = "rgba(198,165,90,0.4)";
const GOLD_FAINT = "rgba(198,165,90,0.1)";
const DIM = "rgba(255,255,255,0.08)";
const DIM_LABEL = "rgba(255,255,255,0.18)";

// ── Dot component ─────────────────────────────────────────────────────────────

function Dot({
  done,
  active,
  reduced,
}: {
  done: boolean;
  active: boolean;
  reduced: boolean | null;
}) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, flexShrink: 0 }}>
      {/* Pulse ring for active dot */}
      {active && !reduced && (
        <motion.div
          animate={{ scale: [1, 1.7, 1], opacity: [0.45, 0, 0.45] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            border: `1.5px solid ${GOLD}`,
            pointerEvents: "none",
          }}
        />
      )}
      <motion.div
        animate={
          active && !reduced
            ? { boxShadow: [`0 0 0 0 ${GOLD_MID}`, `0 0 8px 3px ${GOLD_MID}`, `0 0 0 0 ${GOLD_MID}`] }
            : {}
        }
        transition={active && !reduced ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : {}}
        style={{
          width: done || active ? 14 : 10,
          height: done || active ? 14 : 10,
          borderRadius: "50%",
          background: done
            ? GOLD
            : active
            ? GOLD_FAINT
            : DIM,
          border: `2px solid ${done ? GOLD : active ? GOLD : "rgba(255,255,255,0.12)"}`,
          transition: reduced ? "none" : "all 0.35s ease",
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  deal: PortalClientMatter;
}

export function CustodyTimeline({ deal }: Props) {
  const reduced = useReducedMotion();
  const currentStage = resolveStageCompletion(deal);

  return (
    <div
      data-critical-card=""
      style={{
        background: "rgba(255,255,255,0.01)",
        border: "1px solid rgba(198,165,90,0.14)",
        borderRadius: 6,
        padding: "22px 24px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 20,
        }}
      >
        Chain of Custody
      </div>

      {/* Rail */}
      <div style={{ display: "flex", alignItems: "flex-start", padding: "0 4px" }}>
        {STAGES.map((stage, i) => {
          const done = currentStage > i;
          const active = currentStage === i;
          return (
            <div
              key={stage.id}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}
            >
              {/* Connector before */}
              {i > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: "50%",
                    top: 10,
                    height: 2,
                    background: done || active ? (done ? GOLD : GOLD_MID) : "rgba(255,255,255,0.06)",
                    transition: reduced ? "none" : "background 0.5s ease",
                    zIndex: 0,
                  }}
                />
              )}
              {/* Connector after */}
              {i < STAGES.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    right: 0,
                    top: 10,
                    height: 2,
                    background: done ? GOLD : "rgba(255,255,255,0.06)",
                    transition: reduced ? "none" : "background 0.5s ease",
                    zIndex: 0,
                  }}
                />
              )}

              {/* Dot */}
              <div style={{ position: "relative", zIndex: 1 }}>
                <Dot done={done} active={active} reduced={reduced} />
              </div>

              {/* Label */}
              <div
                style={{
                  marginTop: 7,
                  fontSize: 8,
                  fontFamily: "monospace",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  textAlign: "center",
                  color: active ? GOLD : done ? "rgba(198,165,90,0.5)" : DIM_LABEL,
                  fontWeight: active ? 600 : 400,
                  whiteSpace: "nowrap",
                  transition: reduced ? "none" : "color 0.3s",
                }}
              >
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
