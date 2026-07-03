"use client";
import { useState } from 'react';

import type { AutopilotResult, AutopilotTask } from "@/lib/autopilot/engine";

interface AutopilotScan {
  results: AutopilotResult[];
  total_tasks: number;
  total_blocked: number;
  total_pending: number;
  matters_with_tasks: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f59e0b",
  NORMAL: "#9ca3af",
  LOW: "#6b7280",
};

const TRIGGER_LABELS: Record<string, string> = {
  PAYMENT_CONFIRMED: "Payment Confirmed",
  EXECUTION_SCHEDULED: "Execution Scheduled",
  EXECUTION_COMPLETED: "Execution Completed",
  APOSTILLE_COMPLETED: "Apostille Completed",
  DELIVERED: "Delivered",
};

function TaskRow({
  task,
  confirmed: isConfirmed,
  dismissed: isDismissed,
  onConfirm,
  onDismiss,
}: {
  task: AutopilotTask;
  confirmed: boolean;
  dismissed: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const isBlocked = task.status === "blocked";
  return (
    <div
      style={{
        borderLeft: `3px solid ${isBlocked ? "#ef4444" : PRIORITY_COLORS[task.priority]}`,
        opacity: isDismissed ? 0.45 : 1,
      }}
      className="pl-3 py-2 space-y-1"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-medium ${isDismissed ? "line-through text-white/40" : "text-white"}`}
            >
              {task.task_type.replace(/_/g, " ")}
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                color: PRIORITY_COLORS[task.priority],
                border: `1px solid ${PRIORITY_COLORS[task.priority]}40`,
                background: `${PRIORITY_COLORS[task.priority]}10`,
              }}
            >
              {task.priority}
            </span>
            <span className="text-[10px] text-white/30 uppercase">{task.assignee}</span>
            {isConfirmed && (
              <span className="text-[10px] text-emerald-400 font-semibold">✓ CONFIRMED</span>
            )}
          </div>
          <p className="text-xs text-white/50 mt-0.5">{task.required_action}</p>
          {isBlocked && task.blocker_reason && (
            <p className="text-xs text-red-400 mt-0.5">⚠ {task.blocker_reason}</p>
          )}
        </div>
        {!isDismissed && !isConfirmed && !isBlocked && (
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={onConfirm}
              className="text-xs px-2 py-1 rounded border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={onDismiss}
              className="text-xs px-2 py-1 rounded border border-white/10 text-white/40 hover:bg-white/5 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AutopilotPanel() {
  const [data, setData] = useState<AutopilotScan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  async function scan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/autopilot");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  const allBlocked = data?.results.flatMap((r) => r.blocked_tasks) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40 mt-0.5">
            Scans active matters and surfaces operator-confirmed task suggestions.
          </p>
        </div>
        <button
          onClick={scan}
          disabled={loading}
          className="text-sm px-4 py-2 rounded border font-medium transition-colors"
          style={{
            borderColor: "#C6A55A60",
            color: "#C6A55A",
            background: loading ? "rgba(198,165,90,0.05)" : "transparent",
          }}
        >
          {loading ? "Scanning…" : "Scan Matters"}
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Matters Scanned", value: data.matters_with_tasks },
            { label: "Tasks Generated", value: data.total_tasks },
            { label: "Pending Confirmation", value: data.total_pending },
            { label: "Blocked", value: data.total_blocked, warn: data.total_blocked > 0 },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded border px-4 py-3"
              style={{
                borderColor: s.warn ? "#ef444440" : "rgba(255,255,255,0.08)",
                background: s.warn ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)",
              }}
            >
              <div
                className="text-2xl font-semibold"
                style={{ color: s.warn ? "#ef4444" : "#C6A55A" }}
              >
                {s.value}
              </div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Blocked automations */}
      {allBlocked.length > 0 && (
        <div className="rounded border border-red-500/30 bg-red-500/5 px-4 py-3 space-y-2">
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wider">
            Blocked Automations
          </div>
          {allBlocked.map((t) => (
            <div key={t.id} className="text-sm text-white/70">
              <span className="text-white/30 mr-2 font-mono text-xs">{t.matter_id.slice(0, 8)}</span>
              {t.task_type.replace(/_/g, " ")}
              {t.blocker_reason && (
                <span className="ml-2 text-red-400 text-xs">— {t.blocker_reason}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Per-matter results */}
      {data?.results.map((result) => (
        <div
          key={result.matter_id}
          className="rounded border border-white/8 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8">
            <span className="font-mono text-xs text-white/40">{result.matter_id.slice(0, 8)}</span>
            {result.trigger && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(129,140,248,0.15)", color: "#818cf8" }}
              >
                {TRIGGER_LABELS[result.trigger] ?? result.trigger}
              </span>
            )}
            <span className="text-xs text-white/30 ml-auto">{result.summary}</span>
          </div>
          <div className="px-4 py-3 space-y-3 divide-y divide-white/5">
            {result.tasks.map((task) => (
              <div key={task.id} className="pt-3 first:pt-0">
                <TaskRow
                  task={task}
                  confirmed={confirmed.has(task.id)}
                  dismissed={dismissed.has(task.id)}
                  onConfirm={() => setConfirmed((prev) => new Set(prev).add(task.id))}
                  onDismiss={() => setDismissed((prev) => new Set(prev).add(task.id))}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {data && data.results.length === 0 && (
        <div className="text-sm text-white/30 text-center py-8">
          No autopilot tasks for current active matters.
        </div>
      )}

      {/* Safeguard note */}
      <p className="text-xs text-white/25 border-t border-white/5 pt-4">
        All tasks require operator confirmation before execution. Autopilot never executes automatically.
      </p>
    </div>
  );
}
