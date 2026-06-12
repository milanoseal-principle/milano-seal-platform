"use client";

import { buildFinalReleaseChecklist, evaluateFinalRelease } from "@/lib/safety/final-release-checks";

interface FinalReleasePrepPanelProps {
  matter: {
    destination_country?: string | null;
  };
}

export function FinalReleasePrepPanel({ matter }: FinalReleasePrepPanelProps) {
  const checks = buildFinalReleaseChecklist({ destination_country: matter.destination_country });
  const { released, blockedChecks } = evaluateFinalRelease(checks);

  return (
    <div
      style={{
        background: "rgba(6,13,20,0.65)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 6,
        padding: "14px 16px",
        marginTop: 12,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.55)",
          marginBottom: 12,
          fontFamily: "monospace",
        }}
      >
        Final Release Prep
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {checks.map((check) => (
          <div
            key={check.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: "rgba(255,255,255,0.65)",
              fontFamily: "system-ui, sans-serif",
              padding: "3px 0",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                border: "1px solid rgba(198,165,90,0.3)",
                background: "transparent",
                flexShrink: 0,
              }}
            />
            {check.label}
            {check.severity === "critical" && (
              <span style={{ color: "rgba(200,80,80,0.55)", fontSize: 9 }}>★</span>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 14,
          padding: "10px 12px",
          background: "rgba(6,6,4,0.4)",
          borderRadius: 4,
          border: "1px solid rgba(198,165,90,0.1)",
          fontSize: 11,
          color: "rgba(255,255,255,0.38)",
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.55,
        }}
      >
        {released
          ? "All checks clear. Escalate to founder for final release approval."
          : `${blockedChecks.length} check${blockedChecks.length === 1 ? "" : "s"} require review before escalation. Pricing controls and final release require founder approval.`}
      </div>
    </div>
  );
}
