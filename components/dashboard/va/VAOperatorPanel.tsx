"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { ClipboardList, CheckCircle2, AlertTriangle } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const TASK_TYPES = [
  "verify_upload",
  "request_missing_id",
  "translation_follow_up",
  "courier_confirmation",
  "schedule_reminder",
  "apostille_follow_up",
  "embassy_dependency",
  "client_follow_up",
  "release_coordination",
  "document_correction_required",
] as const;

const URGENCY_LEVELS = ["critical", "high", "medium", "low"] as const;

const URGENCY_COLORS: Record<string, string> = {
  critical: "rgba(239,68,68,0.85)",
  high: "rgba(251,146,60,0.85)",
  medium: "rgba(212,175,55,0.75)",
  low: "rgba(255,255,255,0.25)",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "rgba(212,175,55,0.65)",
  in_progress: "rgba(59,130,246,0.75)",
  review: "rgba(168,85,247,0.75)",
  escalated: "rgba(239,68,68,0.8)",
  completed: "rgba(34,197,94,0.75)",
  cancelled: "rgba(255,255,255,0.2)",
};

interface VATask {
  id: string;
  matter_id: string | null;
  task_type: string;
  urgency: string;
  status: string;
  assigned_to: string;
  assigned_by: string;
  due_at: string | null;
  completed_at: string | null;
  escalated_at: string | null;
  notes_public: string | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
}

interface TasksResponse {
  tasks: VATask[];
  migration_needed?: boolean;
}

function truncate(str: string | null, len = 14): string {
  if (!str) return "—";
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function Badge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      className="px-1.5 py-0.5 rounded-sm text-[8px] font-mono tracking-wider"
      style={{
        color,
        background: color.replace(/[\d.]+\)$/, "0.08)"),
        border: `1px solid ${color.replace(/[\d.]+\)$/, "0.18)")}`,
      }}
    >
      {label.toUpperCase()}
    </span>
  );
}

const EMPTY_FORM = {
  task_type: "verify_upload",
  urgency: "medium",
  assigned_to: "",
  matter_id: "",
  due_at: "",
  notes_public: "",
  next_action: "",
};

export function VAOperatorPanel() {
  const { data, isLoading, refetch } = useApi<TasksResponse>(
    "/api/dashboard/va/tasks"
  );

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  const tasks = data?.tasks ?? [];

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      setConfirmation(false);

      if (!form.assigned_to.trim()) {
        setFormError("Assigned To (VA UUID) is required.");
        return;
      }

      setSubmitting(true);
      try {
        const payload: Record<string, string | undefined> = {
          task_type: form.task_type,
          urgency: form.urgency,
          assigned_to: form.assigned_to.trim(),
        };
        if (form.matter_id.trim()) payload.matter_id = form.matter_id.trim();
        if (form.due_at.trim()) payload.due_at = form.due_at.trim();
        if (form.notes_public.trim()) payload.notes_public = form.notes_public.trim();
        if (form.next_action.trim()) payload.next_action = form.next_action.trim();

        const res = await fetch("/api/dashboard/va/tasks/assign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
          setFormError(json?.error ?? "Failed to assign task.");
          return;
        }

        setForm({ ...EMPTY_FORM });
        setConfirmation(true);
        setTimeout(() => setConfirmation(false), 4000);
        await refetch();
      } catch {
        setFormError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [form, refetch]
  );

  const inputStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.75)",
    borderRadius: "2px",
    fontSize: "12px",
    fontFamily: "var(--font-mono, monospace)",
    width: "100%",
    padding: "6px 10px",
    outline: "none",
  };

  const labelStyle = {
    color: "rgba(212,175,55,0.5)",
    fontSize: "9px",
    fontFamily: "var(--font-mono, monospace)",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    display: "block",
    marginBottom: "4px",
  };

  return (
    <div className="space-y-6">
      {/* ── Active VA Tasks ── */}
      <div
        className="rounded-sm"
        style={{
          background: "rgba(8,5,1,0.99)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="px-5 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div>
            <span
              className="text-[9px] font-mono tracking-[0.3em] block mb-0.5"
              style={{ color: "rgba(212,175,55,0.45)" }}
            >
              ACTIVE VA TASKS
            </span>
            <h2
              className="text-sm font-light"
              style={{
                color: "rgba(255,255,255,0.65)",
                fontFamily: "var(--font-playfair),Georgia,serif",
              }}
            >
              All Assigned Tasks
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList
              size={14}
              style={{ color: "rgba(212,175,55,0.35)" }}
            />
            <span
              className="text-[9px] font-mono"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              {isLoading ? "—" : tasks.length} TASKS
            </span>
          </div>
        </div>

        <div
          className="overflow-y-auto"
          style={{ maxHeight: 400, scrollbarWidth: "none" }}
        >
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 rounded-sm animate-pulse"
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
                NO VA TASKS ASSIGNED
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
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {[
                      "Matter",
                      "Task Type",
                      "Urgency",
                      "Status",
                      "Assigned To",
                      "Due",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left"
                        style={{
                          color: "rgba(212,175,55,0.35)",
                          fontSize: "8px",
                          fontFamily: "var(--font-mono, monospace)",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {tasks.map((task, i) => (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.52,
                          ease: EASE,
                          delay: i * 0.03,
                        }}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                      >
                        <td
                          className="px-4 py-2.5 font-mono"
                          style={{
                            color: "rgba(255,255,255,0.3)",
                            fontSize: "9px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {truncate(task.matter_id, 10)}
                        </td>
                        <td
                          className="px-4 py-2.5"
                          style={{
                            color: "rgba(255,255,255,0.55)",
                            fontSize: "11px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.task_type.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            label={task.urgency}
                            color={URGENCY_COLORS[task.urgency] ?? URGENCY_COLORS.medium}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            label={task.status}
                            color={STATUS_COLORS[task.status] ?? STATUS_COLORS.pending}
                          />
                        </td>
                        <td
                          className="px-4 py-2.5 font-mono"
                          style={{
                            color: "rgba(255,255,255,0.25)",
                            fontSize: "9px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {truncate(task.assigned_to, 10)}
                        </td>
                        <td
                          className="px-4 py-2.5 font-mono"
                          style={{
                            color: "rgba(255,255,255,0.25)",
                            fontSize: "9px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.due_at ? relativeTime(task.due_at) : "—"}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Assign New Task ── */}
      <div
        className="rounded-sm"
        style={{
          background: "rgba(8,5,1,0.99)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span
            className="text-[9px] font-mono tracking-[0.3em] block mb-0.5"
            style={{ color: "rgba(212,175,55,0.45)" }}
          >
            ASSIGN NEW TASK
          </span>
          <h2
            className="text-sm font-light"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            Task Assignment
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Row 1: task_type + urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Task Type</label>
              <select
                value={form.task_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, task_type: e.target.value }))
                }
                style={inputStyle}
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Urgency</label>
              <select
                value={form.urgency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, urgency: e.target.value }))
                }
                style={inputStyle}
              >
                {URGENCY_LEVELS.map((u) => (
                  <option key={u} value={u}>
                    {u.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: assigned_to + matter_id */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Assigned To (VA UUID) *</label>
              <input
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.assigned_to}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assigned_to: e.target.value }))
                }
                style={inputStyle}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div>
              <label style={labelStyle}>Matter ID (optional UUID)</label>
              <input
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.matter_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, matter_id: e.target.value }))
                }
                style={inputStyle}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Row 3: due_at + next_action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Due At (optional)</label>
              <input
                type="datetime-local"
                value={form.due_at}
                onChange={(e) =>
                  setForm((f) => ({ ...f, due_at: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Next Action (optional)</label>
              <input
                type="text"
                placeholder="e.g. Contact client for ID confirmation"
                value={form.next_action}
                onChange={(e) =>
                  setForm((f) => ({ ...f, next_action: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
          </div>

          {/* Row 4: notes_public */}
          <div>
            <label style={labelStyle}>Notes (public)</label>
            <textarea
              rows={3}
              placeholder="Visible to VA — no internal or financial information"
              value={form.notes_public}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes_public: e.target.value }))
              }
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 px-3 py-2 rounded-sm"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <AlertTriangle
                  size={12}
                  style={{ color: "rgba(239,68,68,0.7)" }}
                />
                <p
                  className="text-[10px] font-mono"
                  style={{ color: "rgba(239,68,68,0.7)" }}
                >
                  {formError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation */}
          <AnimatePresence>
            {confirmation && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 px-3 py-2 rounded-sm"
                style={{
                  background: "rgba(212,175,55,0.06)",
                  border: "1px solid rgba(212,175,55,0.15)",
                }}
              >
                <CheckCircle2
                  size={12}
                  style={{ color: "rgba(212,175,55,0.7)" }}
                />
                <p
                  className="text-[10px] font-mono tracking-wider"
                  style={{ color: "rgba(212,175,55,0.7)" }}
                >
                  TASK ASSIGNED
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-sm text-[10px] font-mono tracking-widest transition-opacity disabled:opacity-40"
              style={{
                background: "rgba(212,175,55,0.1)",
                color: "rgba(212,175,55,0.85)",
                border: "1px solid rgba(212,175,55,0.2)",
              }}
            >
              {submitting ? "ASSIGNING..." : "ASSIGN TASK"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
