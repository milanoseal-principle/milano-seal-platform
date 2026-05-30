"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { CheckCircle2, AlertTriangle } from "lucide-react";

const URGENT_EASE = [0.10, 0.9, 0.2, 1] as const;

interface VATask {
  id: string;
  matter_id: string | null;
  task_type: string;
  status: string;
  escalated_at: string | null;
  notes_public: string | null;
}

interface TasksResponse {
  tasks: VATask[];
  migration_needed?: boolean;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function truncate(str: string | null, len = 12): string {
  if (!str) return "—";
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}

export function VAEscalationQueue() {
  const { data, isLoading } = useApi<TasksResponse>("/api/va/tasks");

  const tasks = (data?.tasks ?? []).filter((t) => t.status === "escalated");

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
            style={{ color: "rgba(239,68,68,0.5)" }}
          >
            ESCALATION QUEUE
          </span>
          <h2
            className="text-sm font-light"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            Escalated Tasks
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} style={{ color: "rgba(239,68,68,0.45)" }} />
          <span
            className="text-[9px] font-mono"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            {isLoading ? "—" : tasks.length} ESCALATED
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        className="p-4 space-y-2 overflow-y-auto"
        style={{ maxHeight: 360, scrollbarWidth: "none" }}
      >
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-sm animate-pulse"
                style={{ background: "rgba(255,255,255,0.03)" }}
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.42, ease: URGENT_EASE }}
            className="py-10 flex flex-col items-center gap-3"
          >
            <CheckCircle2 size={28} style={{ color: "rgba(212,175,55,0.2)" }} />
            <p
              className="text-[10px] font-mono tracking-widest text-center"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              NO ESCALATIONS
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{
                  duration: 0.42,
                  ease: URGENT_EASE,
                  delay: i * 0.05,
                }}
                className="rounded-sm p-4"
                style={{
                  background: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.18)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[9px] font-mono tracking-wider"
                        style={{ color: "rgba(239,68,68,0.75)" }}
                      >
                        ESCALATED
                      </span>
                      {task.escalated_at && (
                        <span
                          className="text-[9px] font-mono"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                        >
                          {relativeTime(task.escalated_at)}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs font-light truncate"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {task.task_type.replace(/_/g, " ")}
                    </p>
                    {task.matter_id && (
                      <p
                        className="text-[9px] font-mono mt-0.5"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                      >
                        {truncate(task.matter_id, 16)}
                      </p>
                    )}
                    {task.notes_public && (
                      <p
                        className="text-[10px] mt-1.5 line-clamp-2"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {task.notes_public}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
