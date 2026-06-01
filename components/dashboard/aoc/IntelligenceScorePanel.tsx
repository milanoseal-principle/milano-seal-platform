"use client";

import type { AuthorityIntelligenceScore } from "@/data/authorities/types";

const GOLD = "#C6A55A";
const RED = "#e05252";
const EMERALD = "#4a9e6b";

interface Props {
  scores: AuthorityIntelligenceScore[];
}

function scoreColor(score: number): string {
  if (score >= 80) return EMERALD;
  if (score >= 60) return GOLD;
  if (score >= 40) return `${GOLD}99`;
  return RED;
}

export function IntelligenceScorePanel({ scores }: Props) {
  return (
    <div
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 2,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: `${GOLD}80`,
          marginBottom: 16,
        }}
      >
        Authority Intelligence Scores
      </div>

      {scores.length === 0 ? (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
          No authority records in registry.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {scores.map((s, i) => (
            <div
              key={s.authority_id}
              style={{
                padding: "12px 0",
                borderBottom:
                  i < scores.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
              }}
            >
              {/* Name + score */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.85)",
                    flex: 1,
                  }}
                >
                  {s.authority_name}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: scoreColor(s.total_score),
                    flexShrink: 0,
                  }}
                >
                  {s.total_score}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: scoreColor(s.total_score),
                    flexShrink: 0,
                  }}
                >
                  {s.score_interpretation}
                </div>
              </div>

              {/* Component stats */}
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "monospace",
                  marginBottom: s.missing.length > 0 ? 3 : 0,
                }}
              >
                Sources: {s.source_score}&nbsp;&nbsp;Rules: {s.rule_coverage_score / 20}&nbsp;&nbsp;Confidence: {s.confidence_label}
              </div>

              {/* Missing */}
              {s.missing.length > 0 && (
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.25)",
                    fontStyle: "italic",
                  }}
                >
                  Missing: {s.missing.join(" · ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
