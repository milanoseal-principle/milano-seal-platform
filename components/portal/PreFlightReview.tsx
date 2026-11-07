"use client";

import { motion } from "framer-motion";
import type { PortalClientMatter } from "@/components/portal/portal-context";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";

interface CheckItem {
  id: string;
  label: string;
  note?: string;
  /** derive completion from deal fields */
  check: (deal: PortalClientMatter) => boolean;
}

const PREFLIGHT_ITEMS: CheckItem[] = [
  {
    id: "matter_linked",
    label: "Matter linked to your account",
    check: (d) => !!d.id,
  },
  {
    id: "client_name",
    label: "Client name on file",
    check: (d) => !!d.client_name,
  },
  {
    id: "document_type",
    label: "Document type confirmed",
    check: (d) => !!d.document_type,
  },
  {
    id: "destination_country",
    label: "Destination country confirmed",
    note: "Required for apostille routing",
    check: (d) => !!d.destination_country,
  },
  {
    id: "lane_assigned",
    label: "Execution lane assigned",
    note: "Standard, Expedited, or Emergency",
    check: (d) => !!d.assigned_lane,
  },
  {
    id: "payment_reviewed",
    label: "Invoice reviewed",
    check: (d) =>
      !!d.payment_status &&
      d.payment_status !== "none" &&
      d.payment_status !== "not_required",
  },
  {
    id: "payment_confirmed",
    label: "Payment confirmed",
    note: "Required before scheduling",
    check: (d) =>
      d.payment_status === "paid" ||
      d.payment_status === "confirmed" ||
      d.matter_status === "payment_confirmed" ||
      d.is_paid_and_released,
  },
  {
    id: "scheduling_unlocked",
    label: "Scheduling unlocked",
    note: "Activated after payment confirmation",
    check: (d) =>
      [
        "payment_confirmed",
        "scheduled",
        "in_execution",
        "apostille_processing",
        "courier_ready",
        "shipped",
        "delivered",
        "completed",
        "closed",
      ].includes(d.matter_status ?? ""),
  },
  {
    id: "session_scheduled",
    label: "Execution session scheduled",
    check: (d) =>
      [
        "scheduled",
        "in_execution",
        "apostille_processing",
        "courier_ready",
        "shipped",
        "delivered",
        "completed",
        "closed",
      ].includes(d.matter_status ?? ""),
  },
  {
    id: "execution_complete",
    label: "Notarization / execution completed",
    check: (d) =>
      [
        "in_execution",
        "apostille_processing",
        "courier_ready",
        "shipped",
        "delivered",
        "completed",
        "closed",
      ].includes(d.matter_status ?? ""),
  },
  {
    id: "apostille_submitted",
    label: "Apostille submitted to authority",
    check: (d) =>
      [
        "apostille_processing",
        "courier_ready",
        "shipped",
        "delivered",
        "completed",
        "closed",
      ].includes(d.matter_status ?? ""),
  },
  {
    id: "courier_released",
    label: "Released to courier",
    check: (d) =>
      ["shipped", "delivered", "completed", "closed"].includes(
        d.matter_status ?? "",
      ),
  },
  {
    id: "delivery_confirmed",
    label: "Delivery confirmed",
    check: (d) =>
      ["delivered", "completed", "closed"].includes(d.matter_status ?? "") ||
      d.is_paid_and_released,
  },
];

interface Props {
  deal: PortalClientMatter;
}

export function PreFlightReview({ deal }: Props) {
  const items = PREFLIGHT_ITEMS.filter((item) => item.id !== "apostille_submitted" || deal.authentication_requirement !== "not_required").map((item) => ({
    ...item,
    done: item.check(deal),
  }));
  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = Math.round((doneCount / total) * 100);
  const allDone = doneCount === total;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.01)",
        border: `1px solid ${allDone ? "rgba(74,158,107,0.25)" : "rgba(198,165,90,0.14)"}`,
        borderRadius: 6,
        padding: "20px 22px",
        marginBottom: 16,
      }}
    >
      {deal.authentication_requirement === "not_required" && <p className="mb-3 text-xs text-white/60">Apostille / authentication: Not required following Milano review.</p>}
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              color: allDone ? EMERALD : GOLD,
              marginBottom: 3,
            }}
          >
            Pre-Flight Review
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 400,
              fontFamily: "var(--font-playfair, Georgia, serif)",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            Matter Readiness
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 300,
              color: allDone ? EMERALD : GOLD,
              lineHeight: 1,
              fontFamily: "monospace",
            }}
          >
            {pct}%
          </div>
          <div
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.3)",
              fontFamily: "monospace",
              marginTop: 2,
            }}
          >
            {doneCount}/{total} complete
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 2,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 1,
          marginBottom: 16,
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: "100%",
            background: allDone
              ? `linear-gradient(90deg, ${EMERALD}, #6fcf97)`
              : `linear-gradient(90deg, ${GOLD}, #e8ca80)`,
            borderRadius: 1,
          }}
        />
      </div>

      {/* Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03, ease: "easeOut" }}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            {/* Checkbox */}
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                border: `1px solid ${item.done ? (allDone ? EMERALD : GOLD) : "rgba(255,255,255,0.12)"}`,
                background: item.done
                  ? allDone
                    ? "rgba(74,158,107,0.12)"
                    : "rgba(198,165,90,0.1)"
                  : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              {item.done && (
                <motion.svg
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  width="9"
                  height="7"
                  viewBox="0 0 9 7"
                  fill="none"
                >
                  <path
                    d="M1 3.5L3.5 6L8 1"
                    stroke={allDone ? EMERALD : GOLD}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              )}
            </div>

            {/* Label */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: item.done
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.38)",
                  lineHeight: 1.4,
                  textDecoration: item.done ? "none" : "none",
                }}
              >
                {item.label}
              </div>
              {item.note && !item.done && (
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.22)",
                    marginTop: 1,
                  }}
                >
                  {item.note}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Completion message */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginTop: 14,
            borderTop: "1px solid rgba(74,158,107,0.15)",
            paddingTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: EMERALD, fontSize: 12 }}>✓</span>
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "monospace",
            }}
          >
            All pre-flight items complete. Matter is fully cleared.
          </span>
        </motion.div>
      )}
    </div>
  );
}
