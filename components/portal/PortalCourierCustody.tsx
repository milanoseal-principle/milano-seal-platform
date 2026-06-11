"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ShippoCourierMotionRail from "@/components/shipping/ShippoCourierMotionRail";
import ShippoStatusBadge from "@/components/shipping/ShippoStatusBadge";
import type { MilanoCourierStatus } from "@/lib/shippo/types";
import { CustodyStateBand } from "@/components/animations/CustodyStateBand";
import type { CustodyStateBandProps } from "@/components/animations/CustodyStateBand";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";
const RED = "#e05252";

interface CourierStatus {
  carrier: string | null;
  tracking_number_display: string | null;
  status: string | null;
  last_updated: string | null;
  delivered_at: string | null;
}

interface Intelligence {
  matter_status: string | null;
  payment_status: string | null;
  paid_and_released: boolean;
  payment_gate?: {
    confirmed: boolean;
    apostilleActive: boolean;
    courierUnlocked: boolean;
  };
  courier_status: CourierStatus | null;
  delivery_eta: string | null;
}

function statusLabel(status: string | null): string {
  if (!status) return "Pending";
  const s = status.toLowerCase();
  if (s === "label_created") return "Label Prepared";
  if (s === "in_transit") return "In Transit";
  if (s === "out_for_delivery") return "Out for Delivery";
  if (s === "delivered") return "Delivered";
  if (s === "returned") return "Returned to Sender";
  if (s === "exception") return "Delivery Exception";
  if (s === "unknown") return "Status Pending";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusColor(status: string | null): string {
  if (!status) return "rgba(255,255,255,0.3)";
  const s = status.toLowerCase();
  if (s === "delivered") return EMERALD;
  if (s === "exception" || s === "returned") return RED;
  if (s === "in_transit" || s === "out_for_delivery") return GOLD;
  return "rgba(255,255,255,0.4)";
}

function GateCopy({ children }: { children: string }) {
  return (
    <p
      style={{
        color: "rgba(255,255,255,0.35)",
        fontSize: 13,
        lineHeight: 1.6,
        margin: 0,
        fontStyle: "italic",
      }}
    >
      {children}
    </p>
  );
}

export function PortalCourierCustody(_props: { matterId?: string } = {}) {
  const [intel, setIntel] = useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const reduced = useReducedMotion();
  const hasData = intel !== null;

  useEffect(() => {
    fetch("/api/portal/me/matter-intelligence")
      .then((r) => r.json() as Promise<{ intelligence: Intelligence | null }>)
      .then((d) => setIntel(d.intelligence ?? null))
      .catch(() => setIntel(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(255,255,255,0.01)",
        border: "1px solid rgba(198,165,90,0.14)",
        borderRadius: 6,
        padding: "24px 28px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.6)",
          marginBottom: 16,
        }}
      >
        Courier &amp; Delivery
      </div>

      {loading && (
        <div
          style={{
            height: 32,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 4,
          }}
        />
      )}

      {!loading && !hasData && (
        <div>
          <p
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 13,
              lineHeight: 1.6,
              margin: "0 0 10px",
              fontStyle: "italic",
            }}
          >
            Courier tracking will appear once your document packet is released to carrier custody.
          </p>
          <p style={{ color: "rgba(198,165,90,0.4)", fontSize: 11, lineHeight: 1.6, margin: 0 }}>
            Courier custody is included in your Milano Seal matter. Your document packet is released
            to carrier custody after payment, execution, and any required apostille or authentication
            steps are complete.
          </p>
        </div>
      )}


      {loading && (
        <div style={{ height: 32, background: "rgba(255,255,255,0.03)", borderRadius: 4 }} />
      )}

      {!loading && !intel && (
        <GateCopy>Courier tracking will appear once your matter is released for shipment.</GateCopy>
      )}

      {!loading && intel && (() => {
        const pg = intel.payment_gate;
        const paid = pg?.confirmed ?? (
          intel.payment_status === "paid" ||
          intel.payment_status === "payment_confirmed" ||
          intel.matter_status === "payment_confirmed"
        );
        const apostilleStatus = intel.matter_status ?? "";
        const apostilleActive = ["apostille_processing"].includes(apostilleStatus);
        const courierUnlocked = pg?.courierUnlocked ?? ["shipped", "delivered", "completed", "closed"].includes(apostilleStatus);
        const cs = intel.courier_status;

        if (!paid) {
          return <GateCopy>Courier release is locked until payment and execution milestones are complete.</GateCopy>;
        }

        if (apostilleActive) {
          return <GateCopy>Courier release unlocks after apostille completion.</GateCopy>;
        }

        if (!courierUnlocked || !cs) {
          return <GateCopy>Courier tracking will appear once your matter is released for shipment.</GateCopy>;
        }

        const color = statusColor(cs.status);
        const isDelivered = cs.status?.toLowerCase() === "delivered";
        const isException = cs.status?.toLowerCase() === "exception" || cs.status?.toLowerCase() === "returned";

        const bandStatus: CustodyStateBandProps["status"] = (() => {
          const s = cs.status?.toLowerCase() ?? "";
          if (s === "delivered") return isException ? "exception" : "delivered";
          if (s === "exception" || s === "returned") return "exception";
          if (s === "in_transit" || s === "out_for_delivery") return "in_transit";
          if (s === "label_created") return "label_purchased";
          return "in_transit";
        })();

        return (
          <div>
            <div style={{ marginBottom: 14 }}>
              <CustodyStateBand
                status={bandStatus}
                carrier={cs.carrier ?? undefined}
                trackingDisplay={cs.tracking_number_display ?? undefined}
                estimatedDelivery={intel.delivery_eta ?? undefined}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                  boxShadow: isDelivered ? `0 0 8px ${EMERALD}60` : undefined,
                }}
              />
              <span style={{ fontSize: 15, fontWeight: 500, color }}>
                {statusLabel(cs.status)}
              </span>
              {isDelivered && (
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: `${EMERALD}18`,
                    border: `1px solid ${EMERALD}40`,
                    color: EMERALD,
                    marginLeft: 4,
                  }}
                >
                  Confirmed
                </span>
              )}
              {isException && (
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: `${RED}14`,
                    border: `1px solid ${RED}35`,
                    color: RED,
                    marginLeft: 4,
                  }}
                >
                  Recovery in progress
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px" }}>
              {cs.carrier && (
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Carrier</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", textTransform: "uppercase" }}>{cs.carrier}</div>
                </div>
              )}
              {cs.tracking_number_display && (
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Tracking</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "monospace", letterSpacing: "0.05em" }}>{cs.tracking_number_display}</div>
                </div>
              )}
              {isDelivered && cs.delivered_at && (
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Delivered</div>
                  <div style={{ fontSize: 12, color: EMERALD }}>
                    {new Date(cs.delivered_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              )}
              {!isDelivered && intel.delivery_eta && (
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Est. Arrival</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    {new Date(intel.delivery_eta).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              )}
              {cs.last_updated && (
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Last Updated</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                    {new Date(cs.last_updated).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {isException && (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  borderRadius: 4,
                  background: `${RED}0a`,
                  border: `1px solid ${RED}25`,
                }}
              >
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                  A delivery exception has been flagged. Your coordinator has been alerted and is following up with the carrier.
                </p>
              </div>
            )}
          </div>
        );
      })()}
    </motion.div>
  );
}
