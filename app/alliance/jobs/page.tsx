"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, RefreshCw, AlertCircle } from "lucide-react";
import { ExecutionCard, type Assignment } from "@/components/alliance/ExecutionCard";
import { AllianceAssistant } from "@/components/alliance/AllianceAssistant";

const EASE = [0.16, 1, 0.3, 1] as const;

const STATUS_SECTIONS: { key: string; label: string; statuses: string[] }[] = [
  { key: "active", label: "Active Assignments", statuses: ["offered", "accepted", "in_progress"] },
  { key: "completed", label: "Completed", statuses: ["completed"] },
];

export default function AllianceJobsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch("/api/alliance/jobs");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setAssignments(data.jobs ?? []);
      setLastRefresh(new Date());
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const active = assignments.filter((a) =>
    ["offered", "accepted", "in_progress"].includes(a.assignment_status),
  );
  const completed = assignments.filter((a) => a.assignment_status === "completed");

  return (
    <div
      className="grid grid-cols-1 xl:grid-cols-12 gap-0 -m-8"
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      {/* ── LEFT PANEL: Dispatch Queue ── */}
      <section
        className="xl:col-span-7 flex flex-col border-r"
        style={{
          background: "rgba(6,4,1,0.97)",
          borderColor: "rgba(255,255,255,0.05)",
        }}
      >
        {/* Queue header */}
        <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div
              className="text-[9px] font-mono uppercase tracking-[0.3em] mb-2"
              style={{ color: "rgba(212,175,55,0.7)" }}
            >
              Trusted Partner Environment
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1
                  className="text-xl font-light tracking-tight text-neutral-100"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  Execution Dispatch Queue
                </h1>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Matter-scoped. Client pricing and platform margins not shown.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {lastRefresh && (
                  <span className="text-[10px] font-mono text-neutral-700">
                    {lastRefresh.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                <button
                  onClick={fetchJobs}
                  disabled={isLoading}
                  className="transition-opacity hover:opacity-70 disabled:opacity-30"
                  style={{ color: "rgba(212,175,55,0.6)" }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Queue body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          {isError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-sm"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-400">
                Unable to load assignments. Check your connection or contact your coordinator.
              </span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="rounded-sm h-24"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                {assignments.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Briefcase
                      className="w-8 h-8"
                      style={{ color: "rgba(212,175,55,0.2)" }}
                    />
                    <div className="text-sm text-neutral-600">No assignments dispatched yet</div>
                    <div className="text-[11px] text-neutral-700 max-w-xs">
                      Assignments will appear here once routing is active and matters are dispatched to your profile.
                    </div>
                  </div>
                ) : (
                  STATUS_SECTIONS.map(({ key, label, statuses }) => {
                    const section = assignments.filter((a) =>
                      statuses.includes(a.assignment_status),
                    );
                    if (section.length === 0) return null;
                    return (
                      <div key={key}>
                        <div
                          className="text-[9px] font-mono uppercase tracking-[0.22em] mb-3"
                          style={{ color: "rgba(255,255,255,0.25)" }}
                        >
                          {label} · {section.length}
                        </div>
                        <div className="space-y-3">
                          {section.map((assignment, idx) => (
                            <ExecutionCard
                              key={assignment.assignment_id}
                              assignment={assignment}
                              index={idx}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Queue footer metrics */}
        {!isLoading && assignments.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="px-8 py-4 border-t flex items-center gap-6"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            {[
              { label: "Offered", count: assignments.filter((a) => a.assignment_status === "offered").length, color: "#d4af37" },
              { label: "Active", count: assignments.filter((a) => ["accepted", "in_progress"].includes(a.assignment_status)).length, color: "#60a5fa" },
              { label: "Complete", count: completed.length, color: "#34d399" },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-2">
                <span
                  className="text-lg font-light font-mono"
                  style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    color: m.color,
                  }}
                >
                  {m.count}
                </span>
                <span
                  className="text-[9px] uppercase tracking-[0.14em]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {m.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── RIGHT PANEL: Status + Alliance Assistant ── */}
      <section
        className="xl:col-span-5 flex flex-col p-8 gap-6"
        style={{ background: "#050301" }}
      >
        {/* Operator status panel */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          className="rounded-sm p-5"
          style={{
            background: "rgba(20,14,4,0.9)",
            border: "1px solid rgba(212,175,55,0.12)",
          }}
        >
          <div
            className="text-[9px] font-mono uppercase tracking-[0.22em] mb-4"
            style={{ color: "rgba(212,175,55,0.55)" }}
          >
            Dispatch Overview
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Offered",
                value: active.filter((a) => a.assignment_status === "offered").length,
                accent: "#d4af37",
              },
              {
                label: "In Progress",
                value: active.filter((a) =>
                  ["accepted", "in_progress"].includes(a.assignment_status),
                ).length,
                accent: "#60a5fa",
              },
              {
                label: "Complete",
                value: completed.length,
                accent: "#34d399",
              },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="text-2xl font-light"
                  style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    color: s.accent,
                  }}
                >
                  {isLoading ? "—" : s.value}
                </div>
                <div
                  className="text-[9px] uppercase tracking-[0.12em] mt-1"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Destination summary */}
          {!isLoading && active.length > 0 && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div
                className="text-[9px] font-mono uppercase tracking-[0.16em] mb-2"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                Active Destinations
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(
                  new Set(active.map((a) => a.destination_country).filter(Boolean)),
                ).map((country) => (
                  <span
                    key={country}
                    className="text-[9px] px-2 py-0.5 rounded-sm font-mono"
                    style={{
                      background: "rgba(212,175,55,0.06)",
                      border: "1px solid rgba(212,175,55,0.18)",
                      color: "rgba(212,175,55,0.7)",
                    }}
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Alliance Assistant */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.28, ease: EASE }}
          className="flex-1 rounded-sm p-5"
          style={{
            background: "rgba(14,10,3,0.9)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <AllianceAssistant />
        </motion.div>
      </section>
    </div>
  );
}
