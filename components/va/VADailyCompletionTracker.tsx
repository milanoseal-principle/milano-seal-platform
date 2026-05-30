"use client";

import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { Clock } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface VATask {
  id: string;
  status: string;
  completed_at: string | null;
}

interface TasksResponse {
  tasks: VATask[];
  migration_needed?: boolean;
}

function isTodayUTC(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

export function VADailyCompletionTracker() {
  const { data, isLoading } = useApi<TasksResponse>("/api/va/tasks");

  const tasks = data?.tasks ?? [];
  const completedToday = tasks.filter(
    (t) => t.status === "completed" && isTodayUTC(t.completed_at)
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.52, ease: EASE }}
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
            DAILY COMPLETION TRACKER
          </span>
          <h2
            className="text-sm font-light"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            Today&rsquo;s Completions
          </h2>
        </div>
        <Clock size={14} style={{ color: "rgba(212,175,55,0.35)" }} />
      </div>

      {/* Body */}
      <div className="px-5 py-6 flex items-center gap-5">
        {isLoading ? (
          <div
            className="h-12 w-16 rounded-sm animate-pulse"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
        ) : completedToday === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.52, ease: EASE }}
            className="flex flex-col items-start gap-2 py-2"
          >
            <div className="flex items-center gap-3">
              <Clock size={20} style={{ color: "rgba(212,175,55,0.2)" }} />
              <p
                className="text-[10px] font-mono tracking-widest"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                NO COMPLETIONS TODAY
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.52, ease: EASE }}
            className="flex items-center gap-4"
          >
            <span
              className="font-light leading-none"
              style={{
                fontSize: "3rem",
                color: "rgba(212,175,55,0.9)",
                fontFamily: "var(--font-playfair),Georgia,serif",
              }}
            >
              {completedToday}
            </span>
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[9px] font-mono tracking-[0.25em]"
                style={{ color: "rgba(212,175,55,0.5)" }}
              >
                TASKS COMPLETED
              </span>
              <span
                className="text-[9px] font-mono tracking-wider"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                TODAY · UTC
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
