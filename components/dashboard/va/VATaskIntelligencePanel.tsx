"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import {
  type VATask,
  type VATaskStatus,
  type VATaskType,
} from "@/lib/vaTasks";

const EASE = [0.16, 1, 0.3, 1] as const;

// VA cannot promote authority, approve release, mark payment confirmed,
// override QA gates, or access restricted fields.
const TASK_TYPE_COLORS: Record<VATaskType, string> = {
  AUTHORITY_DISCOVERY: "#fb923c",
  SOURCE_VALIDATION: "#60a5fa",
  REQUIREMENT_EXTRACTION: "#a78bfa",
  REQUEST_MISSING_DOCUMENT: "#ef4444",
  VERIFY_PROTECTED_IDENTIFIER: "#fbbf24",
  PREPARE_APOSTILLE_PACKET: "#4a9e6b",
  CHECK_COURIER_STATUS: "#2dd4bf",
  FOLLOW_UP_CLIENT: "#C6A55A",
  ESCALATE_TO_OPERATOR: "#f87171",
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "rgba(239,68,68,0.85)",
  HIGH: "rgba(251,146,60,0.85)",
  NORMAL: "rgba(212,175,55,0.75)",
  LOW: "rgba(255,255,255,0.25)",
};


function TaskTypeBadge({ type }: { type: VATaskType }) {
  const color = TASK_TYPE_COLORS[type];
  return (
    <span
      className="px-1.5 py-0.5 rounded-sm text-[8px] font-mono tracking-wider whitespace-nowrap"
      style={{
        color,
        background: `${color}14`,
        border: `1px solid ${color}30`,
      }}
    >
      {type.replace(/_/g, " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.NORMAL;
  return (
    <span
      className="px-1.5 py-0.5 rounded-sm text-[8px] font-mono tracking-wider"
      style={{
        color,
        background: color.replace(/[\d.]+\)$/, "0.08)"),
        border: `1px solid ${color.replace(/[\d.]+\)$/, "0.18)")}`,
      }}
    >
      {priority}
    </span>
  );
}

function TaskCard({
  task,
  onComplete,
  onEscalate,
}: {
  task: VATask;
  onComplete: (id: string) => void;
  onEscalate: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = task.status === "completed";
  const isEscalated = task.status === "escalated";
  const isDone = isCompleted || isEscalated;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDone ? 0.45 : 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="rounded-sm"
      style={{
        background: isDone
          ? "rgba(255,255,255,0.015)"
          : "rgba(255,255,255,0.025)",
        border: `1px solid ${isDone ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      {/* Header row */}
      <div
        className="px-4 py-3 flex items-start gap-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Left: type + matter */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <TaskTypeBadge type={task.task_type} />
            <PriorityBadge priority={task.priority} />
            {task.escalation_required && !isEscalated && (
              <span
                className="px-1.5 py-0.5 rounded-sm text-[8px] font-mono tracking-wider"
                style={{
                  color: "rgba(251,146,60,0.9)",
                  background: "rgba(251,146,60,0.08)",
                  border: "1px solid rgba(251,146,60,0.2)",
                }}
              >
                ESCALATION REQUIRED
              </span>
            )}
            {isCompleted && (
              <span
                className="px-1.5 py-0.5 rounded-sm text-[8px] font-mono tracking-wider"
                style={{
                  color: "rgba(34,197,94,0.75)",
                  background: "rgba(34,197,94,0.06)",
                  border: "1px solid rgba(34,197,94,0.15)",
                }}
              >
                COMPLETED
              </span>
            )}
            {isEscalated && (
              <span
                className="px-1.5 py-0.5 rounded-sm text-[8px] font-mono tracking-wider"
                style={{
                  color: "rgba(248,113,113,0.85)",
                  background: "rgba(248,113,113,0.06)",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                ESCALATED
              </span>
            )}
          </div>
          <p
            className="text-[10px] font-mono"
            style={{ color: "rgba(212,175,55,0.5)" }}
          >
            {task.matter_label}
          </p>
        </div>

        {/* Expand toggle */}
        <div style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </div>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 space-y-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
            >
              {/* Required action */}
              <div className="pt-3">
                <p
                  className="text-[8px] font-mono tracking-[0.2em] mb-1.5"
                  style={{ color: "rgba(212,175,55,0.35)" }}
                >
                  REQUIRED ACTION
                </p>
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {task.required_action}
                </p>
              </div>

              {/* Escalation note */}
              {task.escalation_note && (
                <div
                  className="px-3 py-2 rounded-sm flex items-start gap-2"
                  style={{
                    background: "rgba(251,146,60,0.05)",
                    border: "1px solid rgba(251,146,60,0.12)",
                  }}
                >
                  <AlertTriangle
                    size={11}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: "rgba(251,146,60,0.7)" }}
                  />
                  <p
                    className="text-[10px] font-mono"
                    style={{ color: "rgba(251,146,60,0.7)" }}
                  >
                    {task.escalation_note}
                  </p>
                </div>
              )}

              {/* Role indicator */}
              <p
                className="text-[8px] font-mono tracking-[0.2em]"
                style={{ color: "rgba(255,255,255,0.15)" }}
              >
                ALLOWED ROLE · {task.allowed_role.toUpperCase()}
              </p>

              {/* Actions */}
              {!isDone && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplete(task.id);
                    }}
                    className="px-3 py-1.5 rounded-sm text-[9px] font-mono tracking-widest transition-opacity hover:opacity-80"
                    style={{
                      background: "rgba(34,197,94,0.08)",
                      color: "rgba(34,197,94,0.8)",
                      border: "1px solid rgba(34,197,94,0.18)",
                    }}
                  >
                    MARK COMPLETE
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEscalate(task.id);
                    }}
                    className="px-3 py-1.5 rounded-sm text-[9px] font-mono tracking-widest transition-opacity hover:opacity-80"
                    style={{
                      background: "rgba(248,113,113,0.06)",
                      color: "rgba(248,113,113,0.8)",
                      border: "1px solid rgba(248,113,113,0.15)",
                    }}
                  >
                    ESCALATE
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function VATaskIntelligencePanel() {
  // Fetch tasks from the live API — tasks are generated server-side from
  // real deal state via matter intelligence. Excluded fields (never exposed):
  // client email/phone, internal_notes, operator_notes, revenue, margin,
  // shipping_cost, label_url, storage_path.
  const [fetchedTasks, setFetchedTasks] = useState<VATask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/va-tasks")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setFetchedTasks(Array.isArray(data.tasks) ? data.tasks : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [taskStatuses, setTaskStatuses] = useState<
    Record<string, VATaskStatus>
  >({});

  const tasks = useMemo(
    () =>
      fetchedTasks.map((t) => ({
        ...t,
        status: taskStatuses[t.id] ?? t.status,
      })),
    [fetchedTasks, taskStatuses]
  );

  const openCount = tasks.filter(
    (t) => t.status === "open" || t.status === "in_progress"
  ).length;

  const handleComplete = (id: string) => {
    setTaskStatuses((prev) => ({ ...prev, [id]: "completed" }));
  };

  const handleEscalate = (id: string) => {
    setTaskStatuses((prev) => ({ ...prev, [id]: "escalated" }));
  };

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
            TASK INTELLIGENCE
          </span>
          <h2
            className="text-sm font-light"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            VA Priority Queue
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Brain size={14} style={{ color: "rgba(212,175,55,0.35)" }} />
          <span
            className="text-[9px] font-mono"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            {openCount} OPEN
          </span>
        </div>
      </div>

      {/* Restriction notice */}
      <div
        className="px-5 py-2.5 flex items-center gap-2"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.03)",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <AlertTriangle size={10} style={{ color: "rgba(212,175,55,0.3)" }} />
        <p
          className="text-[8px] font-mono tracking-wider"
          style={{ color: "rgba(255,255,255,0.18)" }}
        >
          VA WORKSPACE · NO REVENUE · NO OPERATOR NOTES · NO CLIENT IDENTIFIERS
          · MATTER LABELS ONLY
        </p>
      </div>

      {/* Task list */}
      <div className="p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="py-10 flex flex-col items-center gap-3"
            >
              <Brain size={22} style={{ color: "rgba(212,175,55,0.2)" }} />
              <p
                className="text-[10px] font-mono tracking-widest text-center"
                style={{ color: "rgba(255,255,255,0.18)" }}
              >
                LOADING MATTER INTELLIGENCE…
              </p>
            </motion.div>
          ) : tasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.52, ease: EASE }}
              className="py-10 flex flex-col items-center gap-3"
            >
              <CheckCircle2
                size={28}
                style={{ color: "rgba(212,175,55,0.2)" }}
              />
              <p
                className="text-[10px] font-mono tracking-widest text-center"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                NO VA TASKS CURRENTLY ASSIGNED
              </p>
            </motion.div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onEscalate={handleEscalate}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
