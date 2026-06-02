"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageEntry, staggerContainer, staggerItem, EASE } from "@/lib/animations";

interface MatterRow {
  id: string;
  client_name_masked: string;
  matter_status: string;
  destination_country: string;
  document_type: string;
  days_blocked: number;
  severity: string;
  pipeline_stage?: number;
  pipeline_blocked?: boolean;
  pipeline_exception?: boolean;
}

interface ExecutionData {
  payment_issues: MatterRow[];
  authority_issues: MatterRow[];
  courier_issues: MatterRow[];
  translation_issues: MatterRow[];
  missing_docs: MatterRow[];
  blocked_3d: MatterRow[];
  blocked_7d: MatterRow[];
  needs_operator: MatterRow[];
}

const SEVERITY_COLORS: Record<string, string> = {
  RED: "#ef4444",
  AMBER: "#f59e0b",
  GREEN: "#4a9e6b",
  GOLD: "#C6A55A",
};

const CATEGORY_CONFIG = [
  { key: "blocked_7d", label: "Blocked 7+ Days", severity: "RED" },
  { key: "payment_issues", label: "Payment Issues", severity: "RED" },
  { key: "blocked_3d", label: "Blocked 3+ Days", severity: "AMBER" },
  { key: "authority_issues", label: "Authority Review", severity: "AMBER" },
  { key: "translation_issues", label: "Translation Required", severity: "AMBER" },
  { key: "courier_issues", label: "Courier / Shipping", severity: "GREEN" },
  { key: "missing_docs", label: "Missing Documents", severity: "GREEN" },
  { key: "needs_operator", label: "Needs Operator", severity: "GOLD" },
] as const;

function SeverityChip({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] ?? "#888";
  return (
    <span
      style={{
        fontSize: 8,
        fontFamily: "monospace",
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 2,
        padding: "1px 6px",
      }}
    >
      {severity}
    </span>
  );
}

const PIPELINE_STAGES = [
  "Invoice",
  "Payment",
  "Execution",
  "Apostille",
  "Courier",
  "Verification",
  "Release",
];

function PipelineStages({
  activeStage,
  blocked,
  exception,
}: {
  activeStage: number;
  blocked?: boolean;
  exception?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 6, marginBottom: 2 }}>
      {PIPELINE_STAGES.map((stage, i) => {
        const isCompleted = i < activeStage;
        const isActive = i === activeStage;
        const isBlocked = isActive && blocked;
        const isException = isActive && exception;

        return (
          <div key={stage} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && (
              <div
                style={{
                  width: 16,
                  height: 1,
                  background: "rgba(255,255,255,0.08)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {isCompleted && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: (i - 1) * 0.06,
                      ease: EASE as [number, number, number, number],
                    }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "#C6A55A",
                      transformOrigin: "left",
                    }}
                  />
                )}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div
                className={isActive && !blocked && !exception ? "animate-pulse" : ""}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: isCompleted
                    ? "#C6A55A"
                    : isException
                    ? "transparent"
                    : isBlocked
                    ? "transparent"
                    : isActive
                    ? "#C6A55A"
                    : "rgba(255,255,255,0.12)",
                  border: isException
                    ? "1px solid #ef4444"
                    : isBlocked
                    ? "1px solid #f59e0b"
                    : isCompleted || isActive
                    ? "1px solid #C6A55A"
                    : "1px solid rgba(255,255,255,0.15)",
                  animation: isException
                    ? "exceptionPulse 1.6s ease-in-out infinite"
                    : isBlocked
                    ? "blockedGlow 2s ease-in-out infinite"
                    : undefined,
                }}
              />
              <span
                style={{
                  fontSize: 7,
                  fontFamily: "monospace",
                  color: isCompleted
                    ? "rgba(198,165,90,0.6)"
                    : isActive
                    ? "rgba(198,165,90,0.9)"
                    : "rgba(255,255,255,0.2)",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                }}
              >
                {stage}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MatterRowItem({ matter, color }: { matter: MatterRow; color: string }) {
  const [expanded, setExpanded] = useState(false);
  const activeStage = matter.pipeline_stage ?? 0;

  return (
    <motion.div layout style={{ borderRadius: 2 }}>
      <motion.div
        layout
        variants={staggerItem}
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "6px 8px",
          background: expanded ? "rgba(198,165,90,0.04)" : "rgba(255,255,255,0.02)",
          borderRadius: 2,
          borderLeft: `2px solid ${color}60`,
          cursor: "pointer",
          transition: "background 180ms ease",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
              {matter.client_name_masked}
            </span>
            <SeverityChip severity={matter.severity} />
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
            {matter.destination_country} · {matter.document_type}
          </div>
          <PipelineStages
            activeStage={activeStage}
            blocked={matter.pipeline_blocked}
            exception={matter.pipeline_exception}
          />
        </div>
        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "monospace",
              color:
                matter.days_blocked >= 7
                  ? "#ef4444"
                  : matter.days_blocked >= 3
                  ? "#f59e0b"
                  : "rgba(255,255,255,0.5)",
            }}
          >
            {matter.days_blocked}d
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
            {matter.matter_status?.replace(/_/g, " ")}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0, y: 4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 4 }}
            transition={{ duration: 0.28, ease: EASE as [number, number, number, number] }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "10px 8px 8px",
                background: "rgba(198,165,90,0.03)",
                borderLeft: `2px solid ${color}40`,
                marginTop: 2,
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(198,165,90,0.4)",
                  marginBottom: 6,
                }}
              >
                Matter Detail
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {[
                  ["Matter ID", matter.id],
                  ["Status", matter.matter_status?.replace(/_/g, " ")],
                  ["Corridor", matter.destination_country],
                  ["Document", matter.document_type],
                  ["Pipeline", `Stage ${activeStage + 1}/7 — ${PIPELINE_STAGES[activeStage]}${matter.pipeline_blocked ? " (Blocked)" : ""}${matter.pipeline_exception ? " (Exception)" : ""}`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", gap: 16 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", minWidth: 90 }}>{label}</span>
                    <span style={{ fontSize: 10, color: label === "Pipeline" ? "rgba(198,165,90,0.7)" : "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CategoryPanel({
  label,
  severity,
  matters,
}: {
  label: string;
  severity: string;
  matters: MatterRow[];
}) {
  const color = SEVERITY_COLORS[severity] ?? "#888";
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18, ease: EASE as [number, number, number, number] }}
      style={{
        background: "rgba(3,3,5,0.9)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            letterSpacing: "0.32em",
            textTransform: "uppercase" as const,
            color: "rgba(198,165,90,0.5)",
          }}
        >
          {label}
        </div>
        <span
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            fontWeight: 700,
            color,
            background: `${color}15`,
            border: `1px solid ${color}40`,
            borderRadius: 2,
            padding: "2px 8px",
          }}
        >
          {matters.length}
        </span>
      </div>

      {matters.length === 0 ? (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
          No issues
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{ display: "flex", flexDirection: "column", gap: 6 }}
        >
          {matters.slice(0, 10).map((m) => (
            <MatterRowItem key={m.id} matter={m} color={color} />
          ))}
          {matters.length > 10 && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", textAlign: "center" as const, paddingTop: 4 }}>
              +{matters.length - 10} more
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export function ExecutionControlCenter() {
  const [data, setData] = useState<ExecutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/execution-control")
      .then((r) => r.json())
      .then((d) => {
        setData(d as ExecutionData);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load execution control data");
        setLoading(false);
      });
  }, []);

  const totalIssues = data
    ? Object.values(data).reduce((acc, arr) => acc + arr.length, 0)
    : 0;

  return (
    <>
      <style>{`
        @keyframes blockedGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); border-color: rgba(245,158,11,0.5); }
          50% { box-shadow: 0 0 6px 2px rgba(245,158,11,0.2); border-color: rgba(245,158,11,0.9); }
        }
        @keyframes exceptionPulse {
          0%, 100% { border-color: rgba(239,68,68,0.4); }
          50% { border-color: rgba(239,68,68,1); }
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE as [number, number, number, number] }}
        style={{ minHeight: "100vh", background: "#050507", padding: "32px 40px", color: "rgba(255,255,255,0.75)" }}
      >
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 9,
              fontFamily: "monospace",
              letterSpacing: "0.32em",
              textTransform: "uppercase" as const,
              color: "rgba(198,165,90,0.5)",
              marginBottom: 6,
            }}
          >
            Milano Seal — Operations
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: 0 }}>
              Execution Control Center
            </h1>
            {!loading && data && (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: totalIssues > 0 ? "#ef4444" : "#4a9e6b",
                  background: totalIssues > 0 ? "rgba(239,68,68,0.1)" : "rgba(74,158,107,0.1)",
                  border: `1px solid ${totalIssues > 0 ? "rgba(239,68,68,0.3)" : "rgba(74,158,107,0.3)"}`,
                  borderRadius: 2,
                  padding: "3px 10px",
                }}
              >
                {totalIssues} active issues
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
            Real-time matter escalation queue. Operator-only.
          </p>
        </div>

        {loading && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
            Loading execution data...
          </div>
        )}

        {error && (
          <div style={{ fontSize: 13, color: "#ef4444", fontFamily: "monospace" }}>
            {error}
          </div>
        )}

        {data && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 12,
            }}
          >
            {CATEGORY_CONFIG.map(({ key, label, severity }) => (
              <CategoryPanel
                key={key}
                label={label}
                severity={severity}
                matters={data[key as keyof ExecutionData] ?? []}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
