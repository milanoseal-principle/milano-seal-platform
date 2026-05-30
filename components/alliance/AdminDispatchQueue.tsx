"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MapPin, FileText, Clock, ArrowRight, Briefcase } from "lucide-react";

export interface AdminAssignment {
  assignment_id: string;
  deal_ref: string | null;
  document_type: string | null;
  destination_country: string | null;
  origin_state: string | null;
  stage_label: string;
  assignment_status: string;
  dispatch_confirmed: boolean;
  scheduled_at: string | null;
  operator_name: string | null;
  created_at: string;
}

const KINEMATIC_EASE = [0.1, 0.9, 0.2, 1] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  offered: { label: "Offered", color: "#d4af37" },
  accepted: { label: "Accepted", color: "#4ade80" },
  in_progress: { label: "In Progress", color: "#60a5fa" },
  completed: { label: "Complete", color: "#34d399" },
  declined: { label: "Declined", color: "#6b7280" },
  reassigned: { label: "Reassigned", color: "#a78bfa" },
};

export function AdminDispatchQueue({
  assignments,
}: {
  assignments: AdminAssignment[];
}) {
  return (
    <div
      className="rounded-sm"
      style={{ background: "#020101", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Header */}
      <div
        className="px-6 pt-5 pb-4 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
      >
        <div>
          <span
            className="text-[9px] font-mono tracking-[0.3em] block mb-0.5"
            style={{ color: "rgba(212,175,55,0.45)" }}
          >
            AUTOMATED DISTRIBUTION MATRIX
          </span>
          <h3
            className="text-sm font-light"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            Alliance Dispatch Queue
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "#d4af37" }}
          />
          <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
            {assignments.length} RECORDS
          </span>
        </div>
      </div>

      {/* Queue body */}
      <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 440, scrollbarWidth: "none" }}>
        <AnimatePresence mode="popLayout">
          {assignments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-14 flex flex-col items-center gap-3"
            >
              <Briefcase
                className="w-7 h-7"
                style={{ color: "rgba(212,175,55,0.15)" }}
              />
              <div
                className="text-[10px] font-mono tracking-[0.2em]"
                style={{ color: "rgba(255,255,255,0.15)" }}
              >
                NO DISPATCHED MATTERS
              </div>
            </motion.div>
          ) : (
            assignments.map((a, index) => {
              const status = STATUS_CONFIG[a.assignment_status] ?? {
                label: a.assignment_status,
                color: "#6b7280",
              };

              return (
                <motion.div
                  key={a.assignment_id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24, transition: { duration: 0.3 } }}
                  transition={{ ease: KINEMATIC_EASE, duration: 0.45, delay: index * 0.03 }}
                  className="relative rounded-sm overflow-hidden flex items-center justify-between gap-4 p-4"
                  style={{
                    background: "rgba(12,8,2,0.75)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {/* Left status edge */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-px"
                    style={{ background: status.color, opacity: 0.55 }}
                  />

                  <div className="flex-1 min-w-0 space-y-1.5 pl-3">
                    {/* Ref + status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[11px] font-mono tracking-wider"
                        style={{ color: "#d4af37" }}
                      >
                        {a.deal_ref ?? a.assignment_id.slice(0, 8).toUpperCase()}
                      </span>
                      <span
                        className="text-[8px] font-mono uppercase tracking-[0.16em] px-1.5 py-0.5 rounded-sm"
                        style={{
                          color: status.color,
                          background: `${status.color}12`,
                          border: `1px solid ${status.color}30`,
                        }}
                      >
                        {status.label}
                      </span>
                      {a.dispatch_confirmed && (
                        <span
                          className="text-[8px] font-mono"
                          style={{ color: "rgba(52,211,153,0.5)" }}
                        >
                          ✓ Dispatched
                        </span>
                      )}
                    </div>

                    {/* Doc type */}
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(212,175,55,0.4)" }} />
                      <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {a.document_type ?? "Document Execution"}
                      </span>
                    </div>

                    {/* Route + schedule */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.2)" }} />
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
                          {a.origin_state ?? "—"}
                          {a.destination_country ? ` → ${a.destination_country}` : ""}
                        </span>
                      </div>
                      {a.scheduled_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.18)" }} />
                          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.28)" }}>
                            {new Date(a.scheduled_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Operator */}
                    {a.operator_name && (
                      <div
                        className="text-[9px] font-mono tracking-wide"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        OP: {a.operator_name}
                      </div>
                    )}
                  </div>

                  <Link
                    href="/dashboard/deals"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-[9px] font-mono uppercase tracking-[0.1em] flex-shrink-0 transition-opacity hover:opacity-70"
                    style={{
                      background: "rgba(212,175,55,0.05)",
                      border: "1px solid rgba(212,175,55,0.18)",
                      color: "rgba(212,175,55,0.65)",
                    }}
                  >
                    View <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
