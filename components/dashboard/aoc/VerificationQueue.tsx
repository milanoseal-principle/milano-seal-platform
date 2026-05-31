"use client";

import type { ReceivingAuthority } from "@/data/authorities";

const GOLD = "#C6A55A";
const RED = "#e05252";
const AMBER = "#d97706";

function frictionColor(score: number): string {
  if (score >= 8) return RED;
  if (score >= 6) return GOLD;
  return "rgba(255,255,255,0.4)";
}

function confidenceLabel(c: string): { label: string; color: string } {
  if (c === "VERIFICATION_REQUIRED") return { label: "Verification Required", color: "rgba(255,255,255,0.25)" };
  if (c === "UNVERIFIED") return { label: "Unverified", color: AMBER };
  return { label: c, color: "rgba(255,255,255,0.4)" };
}

function truncate(s: string | null, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function authorityTypeBadge(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  authorities: ReceivingAuthority[];
}

export function VerificationQueue({ authorities }: Props) {
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
          color: "rgba(198,165,90,0.5)",
          marginBottom: 16,
        }}
      >
        Verification Queue — {authorities.length}
      </div>

      {authorities.length === 0 ? (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          No authorities in verification queue.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {authorities.map((a, i) => {
            const { label: confLabel, color: confColor } = confidenceLabel(a.authority_confidence);
            return (
              <div
                key={a.id}
                style={{
                  padding: "10px 0",
                  borderBottom:
                    i < authorities.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 3 }}>
                      {a.authority_name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", letterSpacing: "0.08em" }}>
                        {a.country_name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "monospace",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "rgba(198,165,90,0.5)",
                          background: "rgba(198,165,90,0.06)",
                          padding: "1px 6px",
                          borderRadius: 2,
                        }}
                      >
                        {authorityTypeBadge(a.authority_type)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "monospace",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: confColor,
                        }}
                      >
                        {confLabel}
                      </span>
                      {a.source_reference ? (
                        <a
                          href={a.source_reference}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 11, color: GOLD, textDecoration: "none", opacity: 0.7 }}
                        >
                          {a.source_reference}
                        </a>
                      ) : (
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                          No source on file
                        </span>
                      )}
                    </div>
                    {a.notes_operator && (
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4, lineHeight: 1.4 }}>
                        {truncate(a.notes_operator, 60)}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "monospace",
                      color: frictionColor(a.friction_score),
                      flexShrink: 0,
                    }}
                  >
                    {a.friction_score}/10
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
