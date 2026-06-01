"use client";

import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { timeAgo } from "@/lib/format";
import { GitBranch } from "lucide-react";

interface CustodyEvent {
  id: string;
  deal_id: string;
  event: string;
  actor_type: string;
  notes: string | null;
  created_at: string;
  stage_from: string | null;
  stage_to: string | null;
}

interface ApiResponse {
  events: CustodyEvent[];
  error?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const ACTOR_COLORS: Record<string, string> = {
  operator: "#C6A55A",
  system: "rgba(255,255,255,0.3)",
  client: "rgba(99,179,237,0.8)",
  courier: "rgba(167,139,250,0.8)",
};

interface Props {
  matterId: string;
}

export function DashboardCustodyTimeline({ matterId }: Props) {
  const { data, isLoading, isError } = useApi<ApiResponse>(
    `/api/dashboard/custody/${matterId}`
  );

  const events = data?.events ?? [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-4 h-4" style={{ color: "rgba(198,165,90,0.6)" }} />
        <p
          className="text-[9px] font-mono uppercase tracking-[0.28em]"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Chain of Custody
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-sm"
              style={{ background: "rgba(198,165,90,0.03)", border: "1px solid rgba(198,165,90,0.06)" }}
            />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm" style={{ color: "rgba(239,68,68,0.6)" }}>
          Failed to load custody events.
        </p>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <GitBranch className="w-5 h-5" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
            No custody events recorded.
          </p>
        </div>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-[7px] top-2 bottom-2 w-px"
            style={{ background: "rgba(198,165,90,0.1)" }}
          />

          <div className="space-y-3 pl-6">
            {events.map((ev, idx) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: EASE, delay: idx * 0.04 }}
                className="relative"
              >
                {/* Dot */}
                <div
                  className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center"
                  style={{
                    background: "rgba(8,5,1,0.97)",
                    borderColor: ACTOR_COLORS[ev.actor_type] ?? "rgba(255,255,255,0.15)",
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: ACTOR_COLORS[ev.actor_type] ?? "rgba(255,255,255,0.2)" }}
                  />
                </div>

                <div
                  className="px-3 py-2.5 rounded-sm"
                  style={{
                    background: "rgba(198,165,90,0.02)",
                    border: "1px solid rgba(198,165,90,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {ev.event}
                    </span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm shrink-0"
                      style={{
                        color: ACTOR_COLORS[ev.actor_type] ?? "rgba(255,255,255,0.3)",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {ev.actor_type}
                    </span>
                  </div>

                  {(ev.stage_from || ev.stage_to) && (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {ev.stage_from && (
                        <span
                          className="text-[9px] font-mono"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                        >
                          {ev.stage_from}
                        </span>
                      )}
                      {ev.stage_from && ev.stage_to && (
                        <span style={{ color: "rgba(198,165,90,0.3)", fontSize: 9 }}>→</span>
                      )}
                      {ev.stage_to && (
                        <span
                          className="text-[9px] font-mono"
                          style={{ color: "rgba(198,165,90,0.6)" }}
                        >
                          {ev.stage_to}
                        </span>
                      )}
                    </div>
                  )}

                  {ev.notes && (
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {ev.notes}
                    </p>
                  )}

                  <span
                    className="text-[9px] font-mono"
                    style={{ color: "rgba(255,255,255,0.18)" }}
                  >
                    {timeAgo(ev.created_at)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
