"use client";

import { computeMatterRisk, type MatterRiskFactors } from "@/lib/matterRisk";

const LEVEL_STYLES = {
  LOW: { color: "#4a9e6b", border: "rgba(74,158,107,0.4)", bg: "rgba(74,158,107,0.1)" },
  MODERATE: { color: "#f59e0b", border: "rgba(245,158,11,0.4)", bg: "rgba(245,158,11,0.1)" },
  HIGH: { color: "#ef4444", border: "rgba(239,68,68,0.4)", bg: "rgba(239,68,68,0.1)" },
  EXECUTIVE: { color: "#C6A55A", border: "rgba(198,165,90,0.6)", bg: "rgba(198,165,90,0.1)" },
};

export function MatterRiskBadge({ factors }: { factors: MatterRiskFactors }) {
  const result = computeMatterRisk(factors);
  const style = LEVEL_STYLES[result.level];

  return (
    <span
      title={`Risk score: ${result.score}/100. ${result.operator_note}`}
      style={{
        fontSize: 9,
        fontFamily: "monospace",
        letterSpacing: "0.15em",
        textTransform: "uppercase" as const,
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 2,
        padding: "2px 8px",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        cursor: "help",
        animation: result.level === "EXECUTIVE" ? "pulse 2s infinite" : undefined,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: style.color,
          flexShrink: 0,
        }}
      />
      {result.level} RISK · {result.score}
    </span>
  );
}
