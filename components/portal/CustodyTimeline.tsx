"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// ── Event label map ───────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  DOC_RECEIVED: "Document Received",
  IDENTITY_VERIFIED: "Identity Verified",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  DOC_NOTARIZED: "Notarization Completed",
  DOC_APOSTILLE_SUBMITTED: "Apostille Submitted",
  DOC_APOSTILLE_RECEIVED: "Apostille Released",
  DOC_LABEL_CREATED: "Courier Label Created",
  DOC_SHIPPED: "Released to Courier",
  DOC_IN_TRANSIT: "In Transit",
  DOC_OUT_FOR_DELIVERY: "Out for Delivery",
  DOC_DELIVERED: "Delivered",
  DOC_RELEASE_CONFIRMED: "Custody Released",
  RELEASE_GATE_OVERRIDE: "Operator Override",
  PAYMENT_RECEIVED: "Payment Received",
  // fallbacks for other events
  DOC_CREATED: "Matter Opened",
  DOC_IN_POSSESSION: "Document in Possession",
  DOC_HANDOFF: "Document Transferred",
  DOC_SIGNED: "Document Signed",
};

function humanLabel(event: string): string {
  return EVENT_LABELS[event] ?? event.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimelineEvent {
  id: string;
  deal_id: string;
  event: string;
  actor_type: string;
  notes: string | null;
  created_at: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CustodyTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portal/me/timeline")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load timeline");
        return r.json() as Promise<{ events: TimelineEvent[] }>;
      })
      .then((data) => {
        setEvents(data.events ?? []);
      })
      .catch(() => {
        setError("Unable to load custody timeline.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
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
          marginBottom: 20,
        }}
      >
        Chain of Custody
      </div>

      {loading && (
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.82rem", padding: "0.5rem 0" }}>
          Loading timeline…
        </p>
      )}

      {error && (
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.82rem", padding: "0.5rem 0" }}>
          {error}
        </p>
      )}

      {!loading && !error && events.length === 0 && (
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.82rem", padding: "0.5rem 0" }}>
          No custody events recorded yet.
        </p>
      )}

      {!loading && !error && events.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {events.map((evt, i) => {
            const isLast = i === events.length - 1;
            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08, ease: "easeOut" }}
                style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}
              >
                {/* Bullet + line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: "#C6A55A",
                      flexShrink: 0,
                      marginTop: "3px",
                      boxShadow: "0 0 0 2px #0A0A0A, 0 0 0 3px #C6A55A33",
                    }}
                  />
                  {!isLast && (
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.25, delay: i * 0.08 + 0.15, ease: "easeOut" }}
                      style={{
                        width: "1px",
                        backgroundColor: "#2A2A2A",
                        flexGrow: 1,
                        minHeight: "28px",
                        transformOrigin: "top",
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div style={{ paddingBottom: isLast ? 0 : "1.25rem", paddingTop: "1px" }}>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.78)",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      margin: "0 0 0.2rem",
                    }}
                  >
                    {humanLabel(evt.event)}
                  </p>
                  {evt.notes && (
                    <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.76rem", margin: "0 0 0.2rem", lineHeight: 1.4 }}>
                      {evt.notes}
                    </p>
                  )}
                  <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.73rem", margin: 0, fontFamily: "monospace" }}>
                    {new Date(evt.created_at).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
