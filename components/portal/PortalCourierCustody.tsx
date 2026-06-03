"use client";

import { useEffect, useState } from "react";
import ShippoCourierMotionRail from "@/components/shipping/ShippoCourierMotionRail";
import ShippoStatusBadge from "@/components/shipping/ShippoStatusBadge";
import type { MilanoCourierStatus } from "@/lib/shippo/types";

interface PortalCourierCustodyProps {
  matterId: string;
}

interface CourierEvent {
  status: string | null;
  status_details: string | null;
  status_date: string | null;
  city?: string | null;
  country?: string | null;
}

interface CourierApiResponse {
  courier_status: string | null;
  carrier: string | null;
  tracking_number_display: string | null;
  tracking_url: string | null;
  events: CourierEvent[];
}

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";

function fmt(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PortalCourierCustody({ matterId }: PortalCourierCustodyProps) {
  const [data, setData] = useState<CourierApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/me/courier?matter_id=${matterId}`)
      .then((r) => (r.ok ? (r.json() as Promise<CourierApiResponse>) : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [matterId]);

  const rawStatus = data?.courier_status?.toUpperCase() ?? "UNKNOWN";
  const status = rawStatus as MilanoCourierStatus;
  const isDelivered = rawStatus === "DELIVERED";
  const isException = rawStatus === "EXCEPTION" || rawStatus === "RETURNED";
  const hasData =
    data != null &&
    (data.courier_status != null ||
      (Array.isArray(data.events) && data.events.length > 0));

  return (
    <div
import { motion, useReducedMotion } from "framer-motion";

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

export function PortalCourierCustody() {
  const [intel, setIntel] = useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const reduced = useReducedMotion();

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
          fontSize: 9,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.5)",
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

      {!loading && hasData && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <ShippoCourierMotionRail
              status={status}
              carrier={data?.carrier}
              trackingNumberDisplay={data?.tracking_number_display}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <ShippoStatusBadge status={status} size="md" />
          </div>

          {isDelivered && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 4,
                background: "rgba(63,164,122,0.06)",
                border: "1px solid rgba(63,164,122,0.2)",
                marginBottom: 14,
              }}
            >
              <p
                style={{ margin: 0, fontSize: 12, color: EMERALD, lineHeight: 1.5 }}
              >
                Your document has been delivered. Final release review is
                pending.
              </p>
            </div>
          )}

          {isException && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 4,
                background: "rgba(184,92,92,0.06)",
                border: "1px solid rgba(184,92,92,0.2)",
                marginBottom: 14,
              }}
            >
              <p
                style={{ margin: 0, fontSize: 12, color: "#B85C5C", lineHeight: 1.5 }}
              >
                A delivery exception has been flagged. Your coordinator has been
                alerted.
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px 24px",
              marginBottom: 16,
            }}
          >
            {data?.carrier && (
              <div>
                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 2,
                  }}
                >
                  Carrier
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.65)",
                    textTransform: "uppercase",
                  }}
                >
                  {data.carrier}
                </div>
              </div>
            )}

            {data?.tracking_number_display && (
              <div>
                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 2,
                  }}
                >
                  Tracking
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.65)",
                    fontFamily: "monospace",
                    letterSpacing: "0.05em",
                  }}
                >
                  {data.tracking_number_display}
                </div>
              </div>
            )}

            {data?.tracking_url && (
              <div>
                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 2,
                  }}
                >
                  Track Online
                </div>
                <a
                  href={data.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: GOLD,
                    textDecoration: "none",
                    borderBottom: `1px solid rgba(198,165,90,0.3)`,
                  }}
                >
                  Open carrier tracking ↗
                </a>
              </div>
            )}
          </div>

          {Array.isArray(data?.events) && data.events.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 10,
                }}
              >
                Tracking Events
              </div>
              {data.events.slice(0, 8).map((ev, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(198,165,90,0.06)",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: i === 0 ? GOLD : "rgba(255,255,255,0.2)",
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.65)",
                        marginBottom: 2,
                      }}
                    >
                      {ev.status_details ?? ev.status ?? "Update"}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "monospace",
                      }}
                    >
                      {ev.status_date ? fmt(ev.status_date) : ""}
                      {ev.city ? ` · ${ev.city}` : ""}
                      {ev.country ? `, ${ev.country}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
        Courier & Delivery
      </div>

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

        return (
          <div>
            {/* Status row */}
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
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: color,
                }}
              >
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

            {/* Details grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px" }}>
              {cs.carrier && (
                <div>
                  <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Carrier</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", textTransform: "uppercase" }}>{cs.carrier}</div>
                </div>
              )}
              {cs.tracking_number_display && (
                <div>
                  <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Tracking</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "monospace", letterSpacing: "0.05em" }}>{cs.tracking_number_display}</div>
                </div>
              )}
              {isDelivered && cs.delivered_at && (
                <div>
                  <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Delivered</div>
                  <div style={{ fontSize: 12, color: EMERALD }}>
                    {new Date(cs.delivered_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              )}
              {!isDelivered && intel.delivery_eta && (
                <div>
                  <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Est. Arrival</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    {new Date(intel.delivery_eta).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              )}
              {cs.last_updated && (
                <div>
                  <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Last Updated</div>
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
