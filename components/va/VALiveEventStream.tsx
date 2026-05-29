"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { Activity, Radio } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface VAEvent {
  id: string;
  task_id: string | null;
  event_type: string;
  actor_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

interface EventsResponse {
  events: VAEvent[];
  migration_needed?: boolean;
}

const EVENT_COLORS: Record<string, string> = {
  task_assigned: "rgba(212,175,55,0.75)",
  task_completed: "rgba(52,211,153,0.75)",
  task_escalated: "rgba(239,68,68,0.75)",
  task_updated: "rgba(96,165,250,0.65)",
  note_added: "rgba(255,255,255,0.35)",
};

function formatRelative(ts: string): string {
  const diff = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return `${Math.round(diff / 86400)}d`;
}

function eventLabel(type: string): string {
  return type.replace(/_/g, " ").toUpperCase();
}

export function VALiveEventStream() {
  const { data, isLoading } = useApi<EventsResponse>("/api/va/events");
  const listRef = useRef<HTMLDivElement>(null);

  const events = data?.events ?? [];

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [events.length]);

  return (
    <div
      className="rounded-sm"
      style={{
        background: "rgba(8,5,1,0.99)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 pt-5 pb-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div>
          <span
            className="text-[9px] font-mono tracking-[0.3em] block mb-0.5"
            style={{ color: "rgba(212,175,55,0.45)" }}
          >
            OPERATIONAL EVENT BUS
          </span>
          <h2
            className="text-sm font-light"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            Live Event Stream
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <motion.div
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Radio size={12} style={{ color: "rgba(212,175,55,0.55)" }} />
            </motion.div>
          )}
          <Activity size={14} style={{ color: "rgba(212,175,55,0.35)" }} />
        </div>
      </div>

      {/* Stream */}
      <div
        ref={listRef}
        className="overflow-y-auto"
        style={{ maxHeight: 380, scrollbarWidth: "none" }}
      >
        {isLoading ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(212,175,55,0.2)" }}>
              SYNCING OPERATIONAL FEED...
            </span>
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.52, ease: EASE }}
          >
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.12)" }}>
                NO ACTIVE EVENTS · STREAM MONITORING
              </span>
            </div>
            {data?.migration_needed && (
              <p
                className="text-[9px] font-mono tracking-wider text-center pb-4"
                style={{ color: "rgba(255,255,255,0.1)" }}
              >
                EVENT TABLE PENDING MIGRATION
              </p>
            )}
          </motion.div>
        ) : (
          <div className="p-3">
            {/* Operational stream header */}
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[8px] tracking-[0.28em] uppercase" style={{ color: "rgba(212,175,55,0.35)" }}>
                OPERATIONAL STREAM
              </span>
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(212,175,55,0.5)", flexShrink: 0 }}
                />
                <span className="font-mono text-[8px]" style={{ color: "rgba(255,255,255,0.15)" }}>LIVE</span>
              </div>
            </div>
            <div className="space-y-px">
              <AnimatePresence mode="popLayout" initial={false}>
                {events.map((ev, i) => {
                  const color =
                    EVENT_COLORS[ev.event_type] ?? "rgba(255,255,255,0.3)";
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.52,
                        ease: EASE,
                        delay: i * 0.025,
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-sm"
                      style={{
                        background: i === 0
                          ? "rgba(212,175,55,0.03)"
                          : "transparent",
                      }}
                    >
                      <div
                        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                        style={{ background: color }}
                      />
                      <span
                        className="text-[9px] font-mono tracking-wider flex-1 truncate"
                        style={{ color }}
                      >
                        {eventLabel(ev.event_type)}
                      </span>
                      {ev.task_id && (
                        <span
                          className="text-[9px] font-mono truncate max-w-[80px]"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                        >
                          {ev.task_id.slice(0, 8)}
                        </span>
                      )}
                      <span
                        className="text-[9px] font-mono flex-shrink-0"
                        style={{ color: "rgba(255,255,255,0.18)" }}
                      >
                        {formatRelative(ev.created_at)}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
