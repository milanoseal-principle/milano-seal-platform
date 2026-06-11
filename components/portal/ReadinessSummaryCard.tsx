"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ClientReadinessSummary } from "@/lib/executionReadiness";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";
const RED = "#e05252";

function scoreColor(score: number): string {
  if (score >= 70) return EMERALD;
  if (score >= 40) return GOLD;
  return RED;
}

function ScoreRing({
  score,
  reduced,
}: {
  score: number;
  reduced: boolean | null;
}) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const color = scoreColor(score);
  const dash = (score / 100) * circ;

  return (
    <svg width={72} height={72} style={{ display: "block" }}>
      <circle
        cx={36}
        cy={36}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={4}
      />
      <motion.circle
        cx={36}
        cy={36}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }
        }
        transform="rotate(-90 36 36)"
      />
      <text
        x={36}
        y={36}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={15}
        fontWeight={600}
        fontFamily="monospace"
      >
        {score}
      </text>
    </svg>
  );
}

// Derive a single next-action sentence from the summary
function deriveNextAction(r: ClientReadinessSummary): string {
  if (!r.executionReady && r.missingItems.length > 0) {
    const first = r.missingItems[0];
    if (first.toLowerCase().includes("payment")) {
      return "Payment is required before your execution session can be scheduled.";
    }
    if (first.toLowerCase().includes("witness")) {
      return `Please arrange ${r.witnessRequired ? "the required witnesses" : "witnesses"} for your notarization appointment.`;
    }
    if (first.toLowerCase().includes("translation")) {
      return `A ${r.translationLanguage ? r.translationLanguage + " " : ""}translation is required before your document can proceed.`;
    }
    return `Outstanding: ${first}. Contact your coordinator if you have questions.`;
  }
  if (r.executionReady) {
    return "Your matter is on track. No action required from you at this time.";
  }
  return "Your coordinator will contact you with the next step.";
}

export function ReadinessSummaryCard() {
  const [readiness, setReadiness] = useState<ClientReadinessSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    fetch("/api/portal/me/readiness")
      .then((r) => r.json() as Promise<{ readiness: ClientReadinessSummary | null }>)
      .then((d) => setReadiness(d.readiness ?? null))
      .catch(() => setReadiness(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.01)",
          border: "1px solid rgba(198,165,90,0.08)",
          borderRadius: 6,
          padding: "24px 28px",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "monospace", color: "rgba(198,165,90,0.5)", marginBottom: 12 }}>
          Execution Readiness
        </div>
        <div style={{ height: 72, display: "flex", alignItems: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>
    );
  }

  if (!readiness) return null;

  const nextAction = deriveNextAction(readiness);
  const color = scoreColor(readiness.score);
  const hasMissing = readiness.missingItems.length > 0;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(255,255,255,0.01)",
        border: "1px solid rgba(198,165,90,0.14)",
        borderRadius: 6,
        padding: "24px 28px",
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "monospace", color: "rgba(198,165,90,0.6)", marginBottom: 16 }}>
        Execution Readiness
      </div>

      {/* Score + summary row */}
      <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20 }}>
        <ScoreRing score={readiness.score} reduced={reduced} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: color, fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
            {readiness.riskLevel === "low" ? "On Track" : readiness.riskLevel === "medium" ? "Action Needed" : "Attention Required"}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
            {nextAction}
          </div>
        </div>
      </div>

      {/* Required items checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {readiness.requiredItems.map((label) => {
          const done = !readiness.missingItems.includes(label);
          return (
            <motion.div
              key={label}
              initial={reduced ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 10px",
                borderRadius: 4,
                background: done ? "rgba(74,158,107,0.05)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${done ? "rgba(74,158,107,0.15)" : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  background: done ? EMERALD : "rgba(255,255,255,0.04)",
                  border: `1px solid ${done ? EMERALD : "rgba(255,255,255,0.1)"}`,
                  color: done ? "#fff" : "rgba(255,255,255,0.2)",
                }}
              >
                {done ? "✓" : "·"}
              </div>
              <span style={{ fontSize: 12, color: done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.75)" }}>
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* RON / witness / translation callouts */}
      {(readiness.ronEligible || readiness.witnessRequired || readiness.translationRequired) && (
        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {readiness.ronEligible && (
            <span style={{
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 9px",
              borderRadius: 99,
              background: "rgba(198,165,90,0.08)",
              border: "1px solid rgba(198,165,90,0.2)",
              color: GOLD,
            }}>
              RON Eligible
            </span>
          )}
          {readiness.witnessRequired && (
            <span style={{
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 9px",
              borderRadius: 99,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.45)",
            }}>
              Witnesses Required
            </span>
          )}
          {readiness.translationRequired && (
            <span style={{
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 9px",
              borderRadius: 99,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.45)",
            }}>
              {readiness.translationLanguage ?? "Translation"} Required
            </span>
          )}
        </div>
      )}

      {/* Timeline */}
      {readiness.timeline && readiness.timeline !== "To be determined" && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Est. Timeline</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{readiness.timeline}</div>
          </div>
          {hasMissing && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Outstanding</div>
              <div style={{ fontSize: 12, color: GOLD }}>{readiness.missingItems.length} item{readiness.missingItems.length > 1 ? "s" : ""}</div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
