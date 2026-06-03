"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { CopilotBriefing, CopilotAction } from "@/app/dashboard/copilot/page";

const EASE = [0.16, 1, 0.3, 1] as const;

const PRIORITY_COLORS: Record<CopilotAction["priority"], string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#C6A55A",
  low: "rgba(255,255,255,0.2)",
};

const PRIORITY_LABELS: Record<CopilotAction["priority"], string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const CATEGORY_LABELS: Record<CopilotAction["category"], string> = {
  execution: "EXECUTION",
  revenue: "REVENUE",
  authority: "AUTHORITY",
  relationship: "RELATIONSHIP",
  trust: "TRUST",
  system: "SYSTEM",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "monospace",
        fontSize: "9px",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: "rgba(198,165,90,0.5)",
        marginBottom: "12px",
      }}
    >
      {children}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: CopilotAction["priority"] }) {
  const color = PRIORITY_COLORS[priority];
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: "8px",
        letterSpacing: "0.18em",
        color,
        border: `1px solid ${color}`,
        borderRadius: "2px",
        padding: "1px 5px",
        marginRight: "6px",
        opacity: priority === "low" ? 0.6 : 1,
      }}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function CategoryBadge({ category }: { category: CopilotAction["category"] }) {
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: "8px",
        letterSpacing: "0.15em",
        color: "rgba(255,255,255,0.25)",
        marginRight: "4px",
      }}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function ActionCard({ action, index }: { action: CopilotAction; index: number }) {
  const isCritical = action.priority === "critical";
  const borderColor = PRIORITY_COLORS[action.priority];

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: EASE }}
      style={{
        borderLeft: `2px solid ${borderColor}`,
        background: "rgba(255,255,255,0.02)",
        border: `1px solid rgba(212,175,55,0.08)`,
        borderLeftColor: borderColor,
        borderLeftWidth: "2px",
        borderRadius: "4px",
        padding: "14px 16px",
        marginBottom: "8px",
        position: "relative",
        ...(isCritical
          ? {
              animation: "criticalpulse 400ms ease-out 1",
            }
          : {}),
      }}
    >
      {/* Badges row */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
        <PriorityBadge priority={action.priority} />
        <CategoryBadge category={action.category} />
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#fff",
          marginBottom: "4px",
          lineHeight: 1.3,
        }}
      >
        {action.title}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          marginBottom: "10px",
        }}
      >
        {action.description}
      </div>

      {/* Action link */}
      <div style={{ textAlign: "right" }}>
        <Link
          href={action.actionRoute}
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#C6A55A",
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          → {action.actionLabel}
        </Link>
      </div>
    </motion.div>
  );
}

function SignalChip({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: "4px",
        padding: "10px 14px",
        flex: "1 1 0",
        minWidth: "0",
      }}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "8px",
          letterSpacing: "0.2em",
          color: "rgba(198,165,90,0.45)",
          marginBottom: "4px",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "15px",
          fontWeight: 700,
          color: "#C6A55A",
        }}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

export function OperatorCopilot({ briefing }: { briefing: CopilotBriefing }) {
  const { actions, signals, generatedAt } = briefing;

  const criticalCount = actions.filter((a) => a.priority === "critical").length;
  const highCount = actions.filter((a) => a.priority === "high").length;
  const mediumCount = actions.filter((a) => a.priority === "medium").length;
  const lowCount = actions.filter((a) => a.priority === "low").length;

  const statusLabel =
    criticalCount > 0
      ? "Attention required."
      : highCount > 0
      ? "Priority actions pending."
      : "Platform nominal.";
  const statusColor =
    criticalCount > 0 ? "#f59e0b" : highCount > 0 ? "#f59e0b" : "#4a9e6b";

  const isEmpty = actions.length === 0;

  return (
    <>
      <style>{`
        @keyframes criticalpulse {
          0% { transform: scaleX(1); }
          50% { transform: scaleX(1.012); }
          100% { transform: scaleX(1); }
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE }}
        style={{
          minHeight: "100vh",
          background: "#0A0A0A",
          padding: "32px 24px",
          maxWidth: "820px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "rgba(198,165,90,0.5)",
              marginBottom: "6px",
            }}
          >
            Operator Copilot
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "4px",
            }}
          >
            Milano Seal Intelligence Briefing
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            {formatDate(generatedAt)}
          </div>
        </div>

        {/* Situation Summary */}
        <div
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.08)",
            borderRadius: "6px",
            padding: "16px 20px",
            marginBottom: "20px",
          }}
        >
          <SectionLabel>Situation Summary</SectionLabel>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: statusColor,
              }}
            >
              {statusLabel}
            </span>
            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              {criticalCount > 0 && (
                <span
                  style={{ fontFamily: "monospace", fontSize: "11px", color: "#ef4444" }}
                >
                  {criticalCount} critical
                </span>
              )}
              {highCount > 0 && (
                <span
                  style={{ fontFamily: "monospace", fontSize: "11px", color: "#f59e0b" }}
                >
                  {highCount} high
                </span>
              )}
              {mediumCount > 0 && (
                <span
                  style={{ fontFamily: "monospace", fontSize: "11px", color: "#C6A55A" }}
                >
                  {mediumCount} medium
                </span>
              )}
              {lowCount > 0 && (
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {lowCount} low
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Queue */}
        <div
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.08)",
            borderRadius: "6px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionLabel>Action Queue</SectionLabel>

          {isEmpty ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div
                style={{ fontSize: "28px", marginBottom: "12px" }}
                aria-label="All clear"
              >
                ✓
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#4a9e6b",
                  marginBottom: "6px",
                }}
              >
                All clear. No critical actions.
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                The platform is operating at full capacity.
              </div>
            </div>
          ) : (
            actions.map((action, i) => (
              <ActionCard key={`${action.priority}-${action.category}-${i}`} action={action} index={i} />
            ))
          )}
        </div>

        {/* Intelligence Signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.32, ease: EASE }}
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.08)",
            borderRadius: "6px",
            padding: "20px",
          }}
        >
          <SectionLabel>Intelligence Signals</SectionLabel>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <SignalChip
              label="Top Country (Pipeline)"
              value={signals.topCountry ?? "—"}
            />
            <SignalChip
              label="Avg Paid Deal"
              value={
                signals.avgPaidDealValue > 0
                  ? `$${signals.avgPaidDealValue.toLocaleString()}`
                  : "—"
              }
            />
            <SignalChip
              label="Avg Days to Complete"
              value={signals.avgDaysToComplete > 0 ? `${signals.avgDaysToComplete}d` : "—"}
            />
            <SignalChip
              label="Open Pipeline"
              value={signals.openPipelineCount}
            />
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
