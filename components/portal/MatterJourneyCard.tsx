"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { getWorkflowOrDerive, getCountry, getDocumentType } from "@/data/intelligence";
import type { PortalClientMatter } from "@/components/portal/portal-context";

// ─── Stage definitions ────────────────────────────────────────────────────────

interface JourneyStage {
  id: string;
  label: string;
  keys: string[];
  nextAction: string;
  actionHref?: string;
  actionLabel?: string;
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "intake",
    label: "Received",
    keys: ["new", "intake_received"],
    nextAction: "Your matter has been received and is being structured for review. We'll be in touch within 1 business day.",
  },
  {
    id: "review",
    label: "Under Review",
    keys: ["under_review", "compliance_review", "needs_info", "compliance_blocked"],
    nextAction: "Procedural review is in progress. Watch for a message from your coordinator.",
  },
  {
    id: "payment",
    label: "Payment",
    keys: ["quoted", "awaiting_payment", "payment_confirmed"],
    nextAction: "Your execution proposal is ready. Payment is required before scheduling can begin.",
    actionHref: "/portal/invoice",
    actionLabel: "View Invoice →",
  },
  {
    id: "execution",
    label: "In Execution",
    keys: ["scheduled", "in_execution"],
    nextAction: "Your execution session is scheduled. Please review your pre-flight checklist and prepare your documents.",
  },
  {
    id: "apostille",
    label: "Apostille & Transit",
    keys: ["apostille_processing", "courier_ready", "shipped"],
    nextAction: "Your document is in apostille processing or has been released to courier. No action needed.",
    actionHref: "/portal/tracking",
    actionLabel: "Track Shipment →",
  },
  {
    id: "delivered",
    label: "Delivered",
    keys: ["delivered", "completed", "closed", "review_requested"],
    nextAction: "Your matter is complete. All documents have been delivered and obligations fulfilled.",
    actionHref: "/portal/tracking",
    actionLabel: "View Delivery Proof →",
  },
];

function resolveStageIndex(status: string | null | undefined): number {
  if (!status) return 0;
  const idx = JOURNEY_STAGES.findIndex((s) => s.keys.includes(status));
  return idx === -1 ? 0 : idx;
}

// ─── Execution lane label ─────────────────────────────────────────────────────

function resolveLaneLabel(lane: string | null | undefined): string {
  if (!lane) return "To Be Confirmed";
  switch (lane.toLowerCase()) {
    case "signature": return "Signature Lane";
    case "priority":  return "Priority Lane";
    case "executive": return "Executive Lane";
    default:          return lane.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

// ─── Country/document slug normalizer ─────────────────────────────────────────

function toSlug(str: string | null | undefined): string {
  if (!str) return "";
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const GOLD = "#C6A55A";
const GOLD_FAINT = "rgba(198,165,90,0.12)";
const GOLD_MID = "rgba(198,165,90,0.45)";
const EMERALD = "#4a9e6b";

function StagePip({
  stage,
  index,
  current,
  total,
  reduced,
}: {
  stage: JourneyStage;
  index: number;
  current: number;
  total: number;
  reduced: boolean | null;
}) {
  const done = current > index;
  const active = current === index;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}>
      {/* Connector line before */}
      {index > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: "50%",
            top: 14,
            height: 2,
            background: done || active ? (done ? GOLD : GOLD_MID) : GOLD_FAINT,
            transition: reduced ? "none" : "background 0.5s ease",
            zIndex: 0,
          }}
        />
      )}
      {/* Connector line after */}
      {index < total - 1 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            right: 0,
            top: 14,
            height: 2,
            background: done ? GOLD : GOLD_FAINT,
            transition: reduced ? "none" : "background 0.5s ease",
            zIndex: 0,
          }}
        />
      )}

      {/* Pip */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {active && !reduced && (
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: -5,
              borderRadius: "50%",
              border: `1.5px solid ${GOLD}`,
              pointerEvents: "none",
            }}
          />
        )}
        <motion.div
          animate={
            active && !reduced
              ? { boxShadow: [`0 0 0 0 ${GOLD_MID}`, `0 0 10px 4px ${GOLD_MID}`, `0 0 0 0 ${GOLD_MID}`] }
              : {}
          }
          transition={active && !reduced ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : {}}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: done ? 11 : 10,
            fontWeight: 600,
            background: done
              ? index === total - 1 ? EMERALD : GOLD
              : active
              ? "rgba(198,165,90,0.1)"
              : "rgba(255,255,255,0.04)",
            border: `1.5px solid ${done ? (index === total - 1 ? EMERALD : GOLD) : active ? GOLD : "rgba(255,255,255,0.1)"}`,
            color: done ? "#1a1507" : active ? GOLD : "rgba(255,255,255,0.25)",
            transition: reduced ? "none" : "all 0.35s ease",
          }}
        >
          {done ? "✓" : active ? "●" : index + 1}
        </motion.div>
      </div>

      {/* Label */}
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          fontFamily: "monospace",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          textAlign: "center",
          color: active ? GOLD : done ? "rgba(198,165,90,0.55)" : "rgba(255,255,255,0.3)",
          fontWeight: active ? 600 : 400,
          transition: reduced ? "none" : "color 0.3s",
          whiteSpace: "nowrap",
        }}
      >
        {stage.label}
      </div>
    </div>
  );
}

// ─── Payment gate inline block ─────────────────────────────────────────────────

function PaymentGateBlock({ amountDue }: { amountDue: number | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 4,
        background: "rgba(198,165,90,0.06)",
        border: "1px solid rgba(198,165,90,0.22)",
        marginTop: 12,
      }}
    >
      <span style={{ color: GOLD, fontSize: 14, lineHeight: 1 }}>⬤</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: GOLD }}>
          Payment Required to Unlock Scheduling
        </div>
        {amountDue != null && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
            Amount due: ${amountDue.toLocaleString()}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Status badges ─────────────────────────────────────────────────────────────

function StatusBadge({
  label,
  color,
  icon,
}: {
  label: string;
  color: string;
  icon: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 99,
        fontSize: 10,
        fontFamily: "monospace",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        background: `${color}14`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      <span style={{ fontSize: 8 }}>{icon}</span>
      {label}
    </span>
  );
}

// ─── Workflow intelligence block ───────────────────────────────────────────────

function WorkflowIntelBlock({
  documentType,
  destinationCountry,
}: {
  documentType: string | null;
  destinationCountry: string | null;
}) {
  const countrySlug = toSlug(destinationCountry);
  const docSlug = toSlug(documentType);

  const country = getCountry(countrySlug);
  const doc = getDocumentType(docSlug);
  const workflow = country && doc ? getWorkflowOrDerive(countrySlug, docSlug) : undefined;

  if (!workflow || !country) return null;

  return (
    <div
      style={{
        marginTop: 18,
        padding: "12px 16px",
        borderRadius: 4,
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexWrap: "wrap",
        gap: "10px 24px",
      }}
    >
      <div>
        <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Route</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{workflow.routeType}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Est. Timeline</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{workflow.estimatedTimeline}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Authority</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
          {workflow.apostilleAuthority ?? `${country.name} Consulate`}
        </div>
      </div>
      {workflow.translationRequired && (
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Translation</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
            {workflow.translationLanguage ?? "Required"}
            {workflow.certifiedTranslationRequired ? " · Certified" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  deal: PortalClientMatter;
}

export function MatterJourneyCard({ deal }: Props) {
  const reduced = useReducedMotion();
  const stageIdx = resolveStageIndex(deal.matter_status);
  const currentStage = JOURNEY_STAGES[stageIdx];
  const isPaymentGate =
    (deal.matter_status === "awaiting_payment" || deal.matter_status === "quoted") &&
    deal.payment_status !== "paid" &&
    deal.payment_status !== "confirmed" &&
    deal.payment_status !== "payment_confirmed";
  const paymentConfirmed =
    deal.payment_status === "paid" ||
    deal.payment_status === "confirmed" ||
    deal.matter_status === "payment_confirmed";
  const isShipped = ["shipped", "delivered"].includes(deal.matter_status ?? "");
  const isDelivered = deal.matter_status === "delivered" || deal.matter_status === "completed" || deal.matter_status === "closed" || deal.is_paid_and_released;
  const isApostille = deal.matter_status === "apostille_processing" || deal.matter_status === "courier_ready";

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(255,255,255,0.01)",
        border: "1px solid rgba(198,165,90,0.14)",
        borderRadius: 6,
        padding: "24px 28px",
        marginBottom: 24,
        boxShadow: "0 0 40px rgba(198,165,90,0.04), inset 0 1px 0 rgba(198,165,90,0.06)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              color: "rgba(198,165,90,0.5)",
              marginBottom: 4,
            }}
          >
            Matter Journey
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 300,
              fontFamily: "var(--font-playfair, Georgia, serif)",
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.2,
            }}
          >
            {deal.client_facing_status ??
              (deal.matter_status ?? "intake_received")
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
          </h2>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {deal.document_type ?? "Document execution"} · {deal.destination_country ?? "—"}
          </div>
          <div
            style={{
              marginTop: 6,
              display: "flex",
              flexWrap: "wrap",
              gap: "4px 14px",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: "0.04em",
                color: "rgba(198,165,90,0.65)",
              }}
            >
              {resolveLaneLabel(deal.assigned_lane)}
            </span>
            {deal.display_id || deal.id ? (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  letterSpacing: "0.04em",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                # {(deal.display_id ?? deal.id).slice(0, 8).toUpperCase()}
              </span>
            ) : null}
          </div>
        </div>

        {/* Status badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {paymentConfirmed && (
            <StatusBadge label="Payment Confirmed" color={EMERALD} icon="✓" />
          )}
          {isApostille && (
            <StatusBadge label="Apostille Processing" color={GOLD} icon="◆" />
          )}
          {isShipped && !isDelivered && (
            <StatusBadge label="In Transit" color="#9b7ed4" icon="▶" />
          )}
          {isDelivered && (
            <StatusBadge label="Delivered" color={EMERALD} icon="✓" />
          )}
        </div>
      </div>

      {/* Stage strip */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          padding: "0 14px",
          marginBottom: 8,
        }}
      >
        {JOURNEY_STAGES.map((stage, i) => (
          <StagePip
            key={stage.id}
            stage={stage}
            index={i}
            current={stageIdx}
            total={JOURNEY_STAGES.length}
            reduced={reduced}
          />
        ))}
      </div>

      {/* Next action */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage.id}
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? {} : { opacity: 0, y: -4 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          style={{
            marginTop: 20,
            padding: "12px 16px",
            borderRadius: 4,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.4)",
              marginBottom: 6,
            }}
          >
            What&rsquo;s Next
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
            }}
          >
            {paymentConfirmed && currentStage.id === "payment"
              ? "Payment confirmed — scheduling is now unlocked. Your coordinator will reach out to schedule your execution session."
              : currentStage.nextAction}
          </p>

          {currentStage.actionHref && !isPaymentGate && (
            <a
              href={currentStage.actionHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginTop: 10,
                fontSize: 11,
                fontFamily: "monospace",
                color: GOLD,
                textDecoration: "none",
                letterSpacing: "0.06em",
              }}
            >
              {currentStage.actionLabel}
            </a>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Payment gate block */}
      <AnimatePresence>
        {isPaymentGate && (
          <PaymentGateBlock amountDue={deal.payment_amount_due} />
        )}
      </AnimatePresence>

      {/* Workflow intelligence */}
      <WorkflowIntelBlock
        documentType={deal.document_type}
        destinationCountry={deal.destination_country}
      />
    </motion.div>
  );
}
