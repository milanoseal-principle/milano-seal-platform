"use client";

import { useState } from "react";
import {
  buildFinalReleaseChecklist,
  evaluateFinalRelease,
  type ReleaseCheck,
  type CheckStatus,
} from "@/lib/safety/final-release-checks";

interface FinalSealReviewPanelProps {
  matter: {
    id: string;
    destination_country?: string | null;
  };
  founderMode?: boolean;
}

const STATUS_STYLES: Record<CheckStatus, { color: string; label: string }> = {
  clear:            { color: "rgba(100,200,120,0.8)",  label: "Clear"    },
  needs_review:     { color: "rgba(212,140,42,0.85)",  label: "Review"   },
  blocked:          { color: "rgba(200,80,80,0.85)",   label: "Blocked"  },
  founder_approved: { color: "rgba(100,160,220,0.8)",  label: "Approved" },
};

export function FinalSealReviewPanel({ matter, founderMode = false }: FinalSealReviewPanelProps) {
  const [checks, setChecks] = useState<ReleaseCheck[]>(() =>
    buildFinalReleaseChecklist({ destination_country: matter.destination_country })
  );

  const result = evaluateFinalRelease(checks);

  function markCheck(key: string, status: CheckStatus) {
    setChecks((prev) =>
      prev.map((c) => (c.key === key ? { ...c, status } : c))
    );
  }

  return (
    <div
      style={{
        background: "rgba(6,13,20,0.65)",
        border: `1px solid ${result.released ? "rgba(100,200,120,0.2)" : "rgba(200,80,80,0.2)"}`,
        borderRadius: 6,
        padding: "14px 16px",
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,0.55)",
            fontFamily: "monospace",
          }}
        >
          Final Seal Review
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            padding: "2px 8px",
            borderRadius: 4,
            background: result.released
              ? "rgba(100,200,120,0.12)"
              : "rgba(200,80,80,0.12)",
            color: result.released
              ? "rgba(100,200,120,0.9)"
              : "rgba(200,80,80,0.9)",
          }}
        >
          {result.released ? "RELEASE APPROVED" : `BLOCKED (${result.blockedChecks.length})`}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {checks.map((check) => {
          const style = STATUS_STYLES[check.status];
          return (
            <div
              key={check.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "5px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: style.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.72)",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {check.label}
                {check.severity === "critical" && (
                  <span style={{ color: "rgba(200,80,80,0.6)", marginLeft: 4, fontSize: 9 }}>
                    ★
                  </span>
                )}
              </span>
              {founderMode && (
                <div style={{ display: "flex", gap: 4 }}>
                  {(["clear", "needs_review", "blocked", "founder_approved"] as CheckStatus[]).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => markCheck(check.key, s)}
                        style={{
                          padding: "2px 6px",
                          fontSize: 9,
                          fontFamily: "monospace",
                          background:
                            check.status === s
                              ? STATUS_STYLES[s].color
                              : "transparent",
                          color: check.status === s ? "#000" : STATUS_STYLES[s].color,
                          border: `1px solid ${STATUS_STYLES[s].color}`,
                          borderRadius: 3,
                          cursor: "pointer",
                          opacity: check.status === s ? 1 : 0.5,
                        }}
                      >
                        {STATUS_STYLES[s].label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {result.blockedChecks.length > 0 && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "rgba(200,80,80,0.7)",
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1.5,
          }}
        >
          Final release is blocked. {result.requiresFounderApproval && "Founder approval required to override."}
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: "monospace" }}>
        ★ Critical — must clear before release
      </div>
    </div>
  );
}
