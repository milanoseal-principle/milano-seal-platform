"use client";

import { useState } from "react";
import { AutopilotResult, AutopilotTask } from "@/lib/autopilot/engine";
import { Check, X, AlertTriangle, Zap } from "lucide-react";

interface AutopilotResponse {
  matters: AutopilotResult[];
  summary: {
    total_matters: number;
    total_tasks: number;
    total_pending: number;
    total_blocked: number;
  };
}

const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-red-900/60 text-red-300 border border-red-700",
  HIGH: "bg-amber-900/60 text-amber-300 border border-amber-700",
  NORMAL: "bg-gray-800 text-gray-400 border border-gray-600",
};

const TRIGGER_LABEL: Record<string, string> = {
  PAYMENT_CONFIRMED: "Payment Confirmed",
  EXECUTION_SCHEDULED: "Execution Scheduled",
  EXECUTION_COMPLETED: "Execution Completed",
  APOSTILLE_COMPLETED: "Apostille Completed",
  DELIVERED: "Delivered",
};

export default function AutopilotPanel() {
  const [data, setData] = useState<AutopilotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedTasks, setConfirmedTasks] = useState<Set<string>>(new Set());
  const [dismissedTasks, setDismissedTasks] = useState<Set<string>>(new Set());
  const [expandedMatters, setExpandedMatters] = useState<Set<string>>(new Set());

  async function scanMatters() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/autopilot");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      // Expand all matters by default
      if (json.matters) {
        setExpandedMatters(new Set(json.matters.map((m: AutopilotResult) => m.matter_id)));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to scan matters");
    } finally {
      setLoading(false);
    }
  }

  function confirmTask(taskId: string) {
    setConfirmedTasks((prev) => new Set([...prev, taskId]));
  }

  function dismissTask(taskId: string) {
    setDismissedTasks((prev) => new Set([...prev, taskId]));
  }

  function toggleMatter(matterId: string) {
    setExpandedMatters((prev) => {
      const next = new Set(prev);
      if (next.has(matterId)) next.delete(matterId);
      else next.add(matterId);
      return next;
    });
  }

  // Collect all blocked tasks across matters
  const allBlocked = data?.matters.flatMap((m) => m.blocked) ?? [];

  return (
    <div
      className="rounded-xl border border-white/10 overflow-hidden"
      style={{ background: "rgba(8,5,1,0.97)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5" style={{ color: "#C6A55A" }} />
          <span className="text-white font-semibold text-lg">Matter Intelligence Autopilot</span>
        </div>
        <button
          onClick={scanMatters}
          disabled={loading}
          className="px-4 py-1.5 text-sm font-medium rounded-md transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ border: "1px solid #C6A55A", color: "#C6A55A" }}
        >
          {loading ? "SCANNING…" : "SCAN MATTERS"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-3 bg-red-950/40 border-b border-red-800/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border-b border-white/10 bg-white/5">
          {[
            { label: "Matters Scanned", value: data.summary.total_matters },
            { label: "Tasks Generated", value: data.summary.total_tasks },
            { label: "Pending Confirmation", value: data.summary.total_pending },
            {
              label: "Blocked",
              value: data.summary.total_blocked,
              amber: true,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-5 py-4"
              style={{ background: "rgba(8,5,1,0.97)" }}
            >
              <div
                className={`text-2xl font-bold tabular-nums ${stat.amber ? "text-amber-400" : "text-white"}`}
              >
                {stat.value}
              </div>
              <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Blocked automations */}
      {allBlocked.length > 0 && (
        <div className="mx-6 mt-6 rounded-lg border border-red-800/60 bg-red-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-semibold text-sm">Blocked Automations</span>
          </div>
          <div className="space-y-2">
            {allBlocked.map((task) => (
              <div key={task.id} className="flex items-start gap-3 text-sm">
                <span className="text-white/40 font-mono text-xs mt-0.5 shrink-0">
                  {task.matter_id.slice(0, 8)}
                </span>
                <div>
                  <span className="text-white/70">{task.label}</span>
                  {task.blocked_reason && (
                    <span className="text-red-400/80 ml-2">— {task.blocked_reason}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-matter list */}
      {data && data.matters.length > 0 ? (
        <div className="p-6 space-y-4">
          {data.matters.map((matter) => {
            const isExpanded = expandedMatters.has(matter.matter_id);
            return (
              <div
                key={matter.matter_id}
                className="rounded-lg border border-white/10 overflow-hidden"
              >
                {/* Matter header */}
                <button
                  onClick={() => toggleMatter(matter.matter_id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 font-mono text-xs">
                      {matter.matter_id.slice(0, 8)}…
                    </span>
                    {matter.trigger && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(198,165,90,0.15)",
                          border: "1px solid rgba(198,165,90,0.4)",
                          color: "#C6A55A",
                        }}
                      >
                        {TRIGGER_LABEL[matter.trigger] ?? matter.trigger}
                      </span>
                    )}
                    <span className="text-white/40 text-xs">{matter.total_tasks} tasks</span>
                  </div>
                  <span className="text-white/30 text-xs">{isExpanded ? "▲" : "▼"}</span>
                </button>

                {/* Task list */}
                {isExpanded && (
                  <div className="border-t border-white/10 divide-y divide-white/5">
                    {matter.tasks.map((task) => {
                      const isConfirmed = confirmedTasks.has(task.id);
                      const isDismissed = dismissedTasks.has(task.id);
                      const isBlocked = task.status === "BLOCKED";

                      return (
                        <div
                          key={task.id}
                          className={`px-4 py-3 flex items-start gap-4 ${isBlocked ? "opacity-50" : ""}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm font-medium ${isDismissed ? "line-through text-white/30" : "text-white/80"}`}
                              >
                                {task.label}
                              </span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[task.priority]}`}
                              >
                                {task.priority}
                              </span>
                              {isBlocked && (
                                <span className="text-xs text-red-400">BLOCKED</span>
                              )}
                            </div>
                            <p className="text-xs text-white/40 mt-0.5">{task.description}</p>
                            {task.blocked_reason && (
                              <p className="text-xs text-red-400/70 mt-0.5">
                                {task.blocked_reason}
                              </p>
                            )}
                          </div>
                          {!isBlocked && (
                            <div className="flex items-center gap-2 shrink-0">
                              {isConfirmed ? (
                                <span className="flex items-center gap-1 text-xs text-green-400">
                                  <Check className="w-3.5 h-3.5" />
                                  Confirmed
                                </span>
                              ) : isDismissed ? (
                                <span className="text-xs text-white/30 line-through">Dismissed</span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => confirmTask(task.id)}
                                    className="text-xs px-2.5 py-1 rounded border border-green-700 text-green-400 hover:bg-green-900/30 transition-colors"
                                  >
                                    CONFIRM
                                  </button>
                                  <button
                                    onClick={() => dismissTask(task.id)}
                                    className="text-xs px-2.5 py-1 rounded border border-white/20 text-white/40 hover:bg-white/5 transition-colors"
                                  >
                                    DISMISS
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : data && data.matters.length === 0 ? (
        <div className="px-6 py-12 text-center text-white/30 text-sm">
          No active matters found in autopilot-eligible stages.
        </div>
      ) : !data && !loading ? (
        <div className="px-6 py-12 text-center text-white/30 text-sm">
          Click SCAN MATTERS to load autopilot recommendations.
        </div>
      ) : null}

      {/* Footer note */}
      <div className="px-6 py-3 border-t border-white/10 text-xs text-white/25 text-center">
        All tasks require operator confirmation before execution. Autopilot never executes
        automatically.
      </div>
    </div>
  );
}
