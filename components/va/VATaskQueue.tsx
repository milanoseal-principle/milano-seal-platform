"use client";
import { useState } from 'react';

import { motion, AnimatePresence } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { ClipboardList, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;
const URGENT_EASE = [0.10, 0.9, 0.2, 1] as const;

interface VATask {
  id: string;
  deal_id: string | null;
  task_type: string;
  priority: string;
  status: string;
  assigned_to: string;
  due_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface TasksResponse {
  tasks: VATask[];
  migration_needed?: boolean;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: "CRITICAL", color: "rgba(239,68,68,0.85)" },
  high: { label: "HIGH", color: "rgba(251,146,60,0.85)" },
  medium: { label: "MEDIUM", color: "rgba(212,175,55,0.75)" },
  low: { label: "LOW", color: "rgba(255,255,255,0.25)" },
};

function formatDue(due: string | null): string {
  if (!due) return "";
  const d = new Date(due);
  const now = new Date();
  const diffH = Math.round((d.getTime() - now.getTime()) / 36e5);
  if (diffH < 0) return `${Math.abs(diffH)}h overdue`;
  if (diffH < 1) return "< 1h";
  if (diffH < 24) return `${diffH}h`;
  return `${Math.round(diffH / 24)}d`;
}

export function VATaskQueue() {
  const { data, isLoading, error, refetch } = useApi<TasksResponse>("/api/va/tasks");
  const [completing, setCompleting] = useState<string | null>(null);
  // A refused or failed action must never look like success.
  const [actionError, setActionError] = useState<string | null>(null);
  const [escalating, setEscalating] = useState<string | null>(null);

  const tasks = data?.tasks ?? [];

  async function handleComplete(id: string) {
    setCompleting(id);
    try {
      setActionError(null);
      const res = await fetch(`/api/va/tasks/${id}/complete`, { method: "POST" });
      if (!res.ok) setActionError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Task could not be completed.");
      await refetch();
    } finally {
      setCompleting(null);
    }
  }

  async function handleEscalate(id: string) {
    setEscalating(id);
    try {
      setActionError(null);
      const res = await fetch(`/api/va/tasks/${id}/escalate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "" }),
      });
      if (!res.ok) setActionError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Task could not be escalated.");
      await refetch();
    } finally {
      setEscalating(null);
    }
  }

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
            ASSIGNED TASK QUEUE
          </span>
          <h2
            className="text-sm font-light"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            Active Assignments
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ClipboardList size={14} style={{ color: "rgba(212,175,55,0.35)" }} />
          <span
            className="text-[9px] font-mono"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            {isLoading ? "—" : tasks.length} TASKS
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        className="p-4 space-y-2 overflow-y-auto"
        style={{ maxHeight: 480, scrollbarWidth: "none" }}
      >
        {actionError && (
          <p role="alert" className="text-xs rounded-sm px-3 py-2" style={{ color: "#F2C27A", background: "rgba(242,194,122,0.08)" }}>
            {actionError}
          </p>
        )}
        {error && !isLoading ? (
          <p role="alert" className="py-10 text-center text-sm" style={{ color: "#F2C27A" }}>
            Tasks are unavailable right now. This is not an empty queue — please retry or contact operations.
          </p>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
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
              NO ACTIVE VA TASKS ASSIGNED
            </p>
            {data?.migration_needed && (
              <p
                className="text-[9px] font-mono tracking-wider text-center"
                style={{ color: "rgba(255,255,255,0.12)" }}
              >
                TASK TABLE PENDING MIGRATION
              </p>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.map((task, i) => {
              const priority = PRIORITY_CONFIG[task.priority] ??
                PRIORITY_CONFIG.medium;
              const isOverdue =
                task.due_at && new Date(task.due_at) < new Date();
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{
                    duration: isOverdue ? 0.42 : 0.52,
                    ease: isOverdue ? URGENT_EASE : EASE,
                    delay: i * 0.04,
                  }}
                  className="rounded-sm p-4 flex items-start justify-between gap-3"
                  style={{
                    background: isOverdue
                      ? "rgba(239,68,68,0.04)"
                      : "rgba(255,255,255,0.02)",
                    border: isOverdue
                      ? "1px solid rgba(239,68,68,0.12)"
                      : "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[9px] font-mono tracking-wider"
                        style={{ color: priority.color }}
                      >
                        {priority.label}
                      </span>
                      {task.due_at && (
                        <div className="flex items-center gap-1">
                          <Clock
                            size={9}
                            style={{
                              color: isOverdue
                                ? "rgba(239,68,68,0.7)"
                                : "rgba(255,255,255,0.2)",
                            }}
                          />
                          <span
                            className="text-[9px] font-mono"
                            style={{
                              color: isOverdue
                                ? "rgba(239,68,68,0.7)"
                                : "rgba(255,255,255,0.2)",
                            }}
                          >
                            {formatDue(task.due_at)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p
                      className="text-xs font-light truncate"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {task.task_type}
                    </p>
                    {task.deal_id && (
                      <p
                        className="text-[9px] font-mono mt-0.5 truncate"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                      >
                        {task.deal_id}
                      </p>
                    )}
                    {task.notes && (
                      <p
                        className="text-[10px] mt-1 line-clamp-2"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {task.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleComplete(task.id)}
                      disabled={completing === task.id}
                      className="px-2.5 py-1 rounded-sm text-[9px] font-mono tracking-wider transition-opacity disabled:opacity-40"
                      style={{
                        background: "rgba(212,175,55,0.08)",
                        color: "rgba(212,175,55,0.7)",
                        border: "1px solid rgba(212,175,55,0.12)",
                      }}
                    >
                      {completing === task.id ? "..." : "DONE"}
                    </button>
                    <button
                      onClick={() => handleEscalate(task.id)}
                      disabled={escalating === task.id}
                      className="px-2.5 py-1 rounded-sm text-[9px] font-mono tracking-wider transition-opacity disabled:opacity-40"
                      style={{
                        background: "rgba(239,68,68,0.06)",
                        color: "rgba(239,68,68,0.6)",
                        border: "1px solid rgba(239,68,68,0.1)",
                      }}
                    >
                      {escalating === task.id ? "..." : "ESC"}
                    </button>
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
