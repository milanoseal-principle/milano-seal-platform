"use client";

import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { timeAgo } from "@/lib/format";
import { Activity } from "lucide-react";

interface LogEvent {
  id: string;
  event: string;
  deal_id: string | null;
  actor_type: string | null;
  created_at: string;
}

interface ApiResponse {
  events: LogEvent[];
}

const EASE = [0.16, 1, 0.3, 1] as const;

const ACTOR_COLORS: Record<string, string> = {
  operator: "#C6A55A",
  system: "rgba(255,255,255,0.25)",
  client: "rgba(99,179,237,0.7)",
  courier: "rgba(167,139,250,0.7)",
};

export function OperationalLog() {
  const { data, isLoading, isError } = useApi<ApiResponse>(
    "/api/dashboard/operational-log"
  );

  const events = data?.events ?? [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4" style={{ color: "rgba(198,165,90,0.6)" }} />
        <p
          className="text-[9px] font-mono uppercase tracking-[0.28em]"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Operational Log
        </p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-sm"
              style={{ background: "rgba(198,165,90,0.02)", border: "1px solid rgba(198,165,90,0.05)" }}
            />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm" style={{ color: "rgba(239,68,68,0.5)" }}>
          Failed to load operational log.
        </p>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Activity className="w-5 h-5" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>
            No events recorded.
          </p>
        </div>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className="space-y-1">
          {events.map((ev, idx) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: EASE, delay: idx * 0.03 }}
              className="flex items-center justify-between gap-3 py-2 px-1"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="text-[8px] font-mono uppercase px-1 py-px rounded-sm shrink-0"
                  style={{
                    color:
                      ACTOR_COLORS[ev.actor_type ?? "system"] ??
                      "rgba(255,255,255,0.25)",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {ev.actor_type ?? "system"}
                </span>
                <span
                  className="text-xs truncate"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {ev.event}
                </span>
                {ev.deal_id && (
                  <span
                    className="font-mono text-[9px] shrink-0"
                    style={{ color: "rgba(198,165,90,0.45)" }}
                  >
                    {ev.deal_id.slice(0, 8)}…
                  </span>
                )}
              </div>
              <span
                className="text-[9px] font-mono shrink-0"
                style={{ color: "rgba(255,255,255,0.15)" }}
              >
                {timeAgo(ev.created_at)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
