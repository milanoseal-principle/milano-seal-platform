"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MapPin, FileText, Clock } from "lucide-react";

export interface Assignment {
  assignment_id: string;
  deal_ref: string | null;
  document_type: string | null;
  destination_country: string | null;
  origin_state: string | null;
  stage_label: string;
  assignment_status: string;
  dispatch_confirmed: boolean;
  scheduled_at: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  offered: {
    label: "Offered",
    color: "#d4af37",
    bg: "rgba(212,175,55,0.08)",
    border: "rgba(212,175,55,0.3)",
  },
  accepted: {
    label: "Accepted",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.07)",
    border: "rgba(74,222,128,0.25)",
  },
  in_progress: {
    label: "In Progress",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.07)",
    border: "rgba(96,165,250,0.25)",
  },
  completed: {
    label: "Complete",
    color: "#34d399",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.2)",
  },
};

export function ExecutionCard({
  assignment,
  index,
}: {
  assignment: Assignment;
  index: number;
}) {
  const status = STATUS_CONFIG[assignment.assignment_status] ?? {
    label: assignment.assignment_status,
    color: "#6b7280",
    bg: "rgba(107,114,128,0.05)",
    border: "rgba(107,114,128,0.2)",
  };

  const isOffered = assignment.assignment_status === "offered";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      whileHover={{ y: -1 }}
      style={{ transition: "transform 0.2s" }}
    >
      <div
        className="relative rounded-sm overflow-hidden"
        style={{
          background: "rgba(12,8,2,0.85)",
          border: `1px solid ${isOffered ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.07)"}`,
        }}
      >
        {/* Offered: animated gold top line */}
        {isOffered && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, #d4af37, transparent)",
            }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Reference + status badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="font-mono text-[11px] tracking-[0.08em]"
                style={{ color: "#d4af37" }}
              >
                {assignment.deal_ref ??
                  assignment.assignment_id.slice(0, 8).toUpperCase()}
              </span>
              <span
                className="text-[9px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 rounded-sm"
                style={{
                  color: status.color,
                  background: status.bg,
                  border: `1px solid ${status.border}`,
                }}
              >
                {status.label}
              </span>
              {assignment.dispatch_confirmed && (
                <span className="text-[9px] font-mono tracking-[0.1em] text-emerald-400/60">
                  ✓ Dispatched
                </span>
              )}
            </div>

            {/* Document type */}
            <div className="flex items-center gap-2">
              <FileText
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: "rgba(212,175,55,0.55)" }}
              />
              <span className="text-sm font-medium text-neutral-200 truncate">
                {assignment.document_type ?? "Document Execution"}
              </span>
            </div>

            {/* Route */}
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 flex-shrink-0 text-neutral-600" />
              <span className="text-xs text-neutral-500">
                {assignment.origin_state ?? "—"}
                {assignment.destination_country ? (
                  <>
                    <span className="mx-1.5 text-neutral-700">→</span>
                    {assignment.destination_country}
                  </>
                ) : null}
              </span>
            </div>

            {/* Stage + scheduled */}
            <div className="flex items-center gap-4">
              <span className="text-[9.5px] uppercase tracking-[0.1em] text-neutral-600">
                {assignment.stage_label}
              </span>
              {assignment.scheduled_at && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-700" />
                  <span className="text-[10px] font-mono text-neutral-600">
                    {new Date(assignment.scheduled_at).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Link
            href={`/alliance/jobs/${assignment.assignment_id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-mono uppercase tracking-[0.12em] flex-shrink-0 transition-opacity duration-150 hover:opacity-70"
            style={{
              background: "rgba(212,175,55,0.07)",
              border: "1px solid rgba(212,175,55,0.22)",
              color: "#d4af37",
            }}
          >
            View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
