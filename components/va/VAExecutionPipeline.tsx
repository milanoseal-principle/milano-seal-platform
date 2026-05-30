"use client";

import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { GitBranch } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface VATask {
  id: string;
  task_type: string;
  priority: string;
  status: string;
  due_at: string | null;
}

interface TasksResponse {
  tasks: VATask[];
  migration_needed?: boolean;
}

const PIPELINE_STAGES = [
  { key: "pending", label: "PENDING" },
  { key: "in_progress", label: "IN PROGRESS" },
  { key: "review", label: "REVIEW" },
  { key: "escalated", label: "ESCALATED" },
];

export function VAExecutionPipeline() {
  const { data, isLoading } = useApi<TasksResponse>("/api/va/tasks");
  const tasks = data?.tasks ?? [];

  const stageCounts = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: tasks.filter((t) => t.status === stage.key).length,
  }));

  const total = tasks.length;

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
            TASK EXECUTION PIPELINE
          </span>
          <h2
            className="text-sm font-light"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            Pipeline Overview
          </h2>
        </div>
        <GitBranch size={14} style={{ color: "rgba(212,175,55,0.35)" }} />
      </div>

      <div className="p-5">
        {/* Inner section header */}
        <div className="flex items-center justify-between mb-5">
          <span className="font-mono text-[8px] tracking-[0.28em] uppercase" style={{ color: "rgba(212,175,55,0.35)" }}>
            EXECUTION PIPELINE
          </span>
          <span className="font-mono text-[8px]" style={{ color: "rgba(255,255,255,0.15)" }}>
            {isLoading ? "—" : `${total} ASSIGNED`}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-sm animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="py-6 flex flex-col items-center gap-2">
            <GitBranch size={22} style={{ color: "rgba(212,175,55,0.12)" }} />
            <p
              className="text-[10px] font-mono tracking-widest text-center"
              style={{ color: "rgba(255,255,255,0.18)" }}
            >
              PIPELINE EMPTY
            </p>
            {data?.migration_needed && (
              <p
                className="text-[9px] font-mono tracking-wider"
                style={{ color: "rgba(255,255,255,0.1)" }}
              >
                TASK TABLE PENDING MIGRATION
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stageCounts.map((stage, i) => {
              const pct = total > 0 ? (stage.count / total) * 100 : 0;
              const isEscalated = stage.key === "escalated";
              const isInProgress = stage.key === "in_progress";
              const countColor =
                isEscalated && stage.count > 0
                  ? "rgba(239,68,68,0.7)"
                  : isInProgress && stage.count > 0
                  ? "rgba(212,175,55,0.7)"
                  : "rgba(255,255,255,0.3)";
              return (
                <motion.div
                  key={stage.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.52,
                    ease: EASE,
                    delay: i * 0.06,
                  }}
                  className="rounded-sm p-3"
                  style={{
                    background: isEscalated && stage.count > 0
                      ? "rgba(239,68,68,0.04)"
                      : "rgba(255,255,255,0.02)",
                    border: isEscalated && stage.count > 0
                      ? "1px solid rgba(239,68,68,0.1)"
                      : "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    className="text-[20px] font-light mb-1"
                    style={{
                      color: countColor,
                      fontFamily: "var(--font-playfair),Georgia,serif",
                    }}
                  >
                    {stage.count === 0 ? "—" : stage.count}
                  </div>
                  <div
                    className="text-[9px] font-mono tracking-wider mb-2"
                    style={{
                      color: isEscalated && stage.count > 0
                        ? "rgba(239,68,68,0.5)"
                        : "rgba(255,255,255,0.25)",
                    }}
                  >
                    {stage.label}
                  </div>
                  {/* Progress bar */}
                  <div
                    className="h-px rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: EASE, delay: i * 0.06 + 0.2 }}
                      className="h-full"
                      style={{
                        background: isEscalated && stage.count > 0
                          ? "rgba(239,68,68,0.6)"
                          : "rgba(212,175,55,0.45)",
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
