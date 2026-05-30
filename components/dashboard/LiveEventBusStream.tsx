"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Clock } from "lucide-react";
import { timeAgo } from "@/lib/format";

interface ActivityRow {
  id: string;
  deal_id: string | null;
  actor: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 0.58;

const EVENT_LABELS: Record<string, string> = {
  DOC_CREATED: "Document Created",
  DOC_RECEIVED: "Document Received",
  DOC_IN_POSSESSION: "In Secure Possession",
  DOC_NOTARIZED: "Notarization Complete",
  DOC_APOSTILLE_SUBMITTED: "Apostille Submitted",
  DOC_APOSTILLE_RECEIVED: "Apostille Received",
  DOC_LABEL_CREATED: "Courier Label Created",
  DOC_SHIPPED: "Document Shipped",
  DOC_IN_TRANSIT: "In Transit",
  DOC_DELIVERED: "Delivered",
  DOC_RELEASE_CONFIRMED: "Release Confirmed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  EXECUTION_SCHEDULED: "Execution Scheduled",
  DOCUMENT_UPLOADED: "Document Uploaded",
  APOSTILLE_REQUIRED: "Apostille Required",
  TRANSLATION_REQUIRED: "Translation Required",
  DELIVERY_CONFIRMED: "Delivery Confirmed",
  CLIENT_MESSAGE_SENT: "Client Message",
  COURIER_RELEASED: "Courier Released",
  PAID_AND_RELEASED: "Paid & Released",
};

const EVENT_COLORS: Record<string, string> = {
  PAYMENT_CONFIRMED: "#34d399",
  PAID_AND_RELEASED: "#34d399",
  DELIVERY_CONFIRMED: "#34d399",
  DOC_DELIVERED: "#34d399",
  DOC_RELEASE_CONFIRMED: "#34d399",
  EXECUTION_SCHEDULED: "#60a5fa",
  DOC_SHIPPED: "#60a5fa",
  DOC_IN_TRANSIT: "#60a5fa",
  DOC_LABEL_CREATED: "#60a5fa",
  APOSTILLE_REQUIRED: "#f59e0b",
  TRANSLATION_REQUIRED: "#f59e0b",
};

function resolveLabel(action: string): string {
  const upper = action.toUpperCase().replace(/\./g, "_").replace(/\s+/g, "_");
  for (const [key, label] of Object.entries(EVENT_LABELS)) {
    if (upper.includes(key)) return label;
  }
  return action
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveColor(action: string): string {
  const upper = action.toUpperCase();
  for (const [key, color] of Object.entries(EVENT_COLORS)) {
    if (upper.includes(key)) return color;
  }
  return "#d4af37";
}

export function LiveEventBusStream({ limit = 24 }: { limit?: number }) {
  const [events, setEvents] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activity")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ActivityRow[]) => setEvents(data.slice(0, limit)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [limit]);

  return (
    <div
      className="rounded-sm"
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.1)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between border-b"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2.5">
          <Radio className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(212,175,55,0.55)" }} />
          <div>
            <div
              className="text-[9px] font-mono uppercase tracking-[0.28em]"
              style={{ color: "rgba(212,175,55,0.5)" }}
            >
              Passive Operations Bus
            </div>
            <div
              className="text-[8px] uppercase tracking-[0.14em] mt-0.5"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              Immutable Event History
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "rgba(212,175,55,0.55)" }}
          />
          <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
            {isLoading ? "…" : `${events.length} RECORDS`}
          </span>
        </div>
      </div>

      {/* Stream */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: 360, scrollbarWidth: "none" }}
      >
        {isLoading ? (
          <div className="px-5 py-6 space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="h-10 rounded-sm"
                style={{ background: "rgba(255,255,255,0.02)" }}
                animate={{ opacity: [0.25, 0.55, 0.25] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div
              className="text-[10px] font-mono tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,0.18)" }}
            >
              NO OPERATIONAL EVENTS RECORDED FOR THIS PERIOD.
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {events.map((ev, idx) => {
              const label = resolveLabel(ev.action);
              const color = resolveColor(ev.action);
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ease: EASE, duration: DURATION, delay: Math.min(idx * 0.022, 0.5) }}
                  className="relative flex items-start gap-4 px-5 py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  whileHover={{ backgroundColor: "rgba(212,175,55,0.022)" }}
                >
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: color, opacity: 0.75 }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                      <span
                        className="text-[9px] font-mono uppercase tracking-[0.16em]"
                        style={{ color }}
                      >
                        {label}
                      </span>
                      {ev.deal_id && (
                        <span
                          className="text-[8px] font-mono"
                          style={{ color: "rgba(212,175,55,0.38)" }}
                        >
                          {ev.deal_id.slice(0, 8).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {ev.detail && (
                      <div
                        className="text-[10px] leading-relaxed"
                        style={{ color: "rgba(255,255,255,0.28)" }}
                      >
                        {ev.detail}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-0.5">
                      {ev.actor && (
                        <span
                          className="text-[9px] font-mono"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                        >
                          {ev.actor}
                        </span>
                      )}
                      <span
                        className="text-[9px] font-mono flex items-center gap-1"
                        style={{ color: "rgba(255,255,255,0.16)" }}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(ev.created_at)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
