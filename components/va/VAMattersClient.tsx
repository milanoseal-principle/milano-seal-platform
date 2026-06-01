"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileCheck, Clock, AlertCircle } from "lucide-react";

interface VAMatter {
  matter_id: string;
  task_count: number;
  urgency: string;
  due_at: string | null;
}

const URGENCY_COLOR: Record<string, string> = {
  critical: "rgba(239,68,68,0.85)",
  high: "rgba(251,146,60,0.85)",
  medium: "rgba(212,175,55,0.75)",
  low: "rgba(255,255,255,0.25)",
};

const URGENCY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function VAMattersClient() {
  const [matters, setMatters] = useState<VAMatter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/va/tasks", { cache: "no-store" });
        if (r.ok) {
          const body = (await r.json()) as {
            tasks?: Array<{ matter_id?: string | null; urgency?: string; due_at?: string | null }>;
          };
          const grouped = new Map<string, VAMatter>();
          for (const t of body.tasks ?? []) {
            if (!t.matter_id) continue;
            const existing = grouped.get(t.matter_id);
            if (!existing) {
              grouped.set(t.matter_id, {
                matter_id: t.matter_id,
                task_count: 1,
                urgency: t.urgency ?? "low",
                due_at: t.due_at ?? null,
              });
            } else {
              existing.task_count++;
              if ((URGENCY_RANK[t.urgency ?? "low"] ?? 0) > (URGENCY_RANK[existing.urgency] ?? 0)) {
                existing.urgency = t.urgency ?? "low";
              }
            }
          }
          setMatters(Array.from(grouped.values()));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-3.5 h-3.5" style={{ color: "rgba(212,175,55,0.4)" }} />
        <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
          Matter IDs only · No client PII · No financial data
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : !matters.length ? (
        <div className="text-center py-16">
          <FileCheck className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No matters assigned.</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.15)" }}>
            Matters with active tasks assigned to you will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {matters.map((m, i) => (
            <motion.div
              key={m.matter_id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className="flex items-center justify-between px-4 py-4 rounded-lg border"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: URGENCY_COLOR[m.urgency] ?? "rgba(255,255,255,0.25)" }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-mono truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {m.matter_id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {m.task_count} active task{m.task_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                {m.due_at && (
                  <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <Clock className="w-3 h-3" />
                    {new Date(m.due_at).toLocaleDateString()}
                  </div>
                )}
                <span
                  className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full"
                  style={{
                    background: `${URGENCY_COLOR[m.urgency] ?? "rgba(255,255,255,0.25)"}18`,
                    color: URGENCY_COLOR[m.urgency] ?? "rgba(255,255,255,0.25)",
                    border: `1px solid ${URGENCY_COLOR[m.urgency] ?? "rgba(255,255,255,0.25)"}30`,
                  }}
                >
                  {m.urgency}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
