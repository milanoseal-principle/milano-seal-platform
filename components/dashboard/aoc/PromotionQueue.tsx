"use client";

import type { ReceivingAuthority, AuthorityConfidence } from "@/data/authorities";

const GOLD = "#C6A55A";

function nextConfidenceLevel(current: AuthorityConfidence): string {
  if (current === "OBSERVED") return "Partner Confirmed";
  if (current === "PARTNER_CONFIRMED") return "Multi-Source Confirmed";
  return "Authority Verified";
}

function sourceDomain(ref: string): string {
  try {
    const url = ref.startsWith("http") ? ref : `https://${ref}`;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return ref;
  }
}

function confidenceLabel(c: AuthorityConfidence): string {
  return c.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
}

interface Props {
  authorities: ReceivingAuthority[];
}

export function PromotionQueue({ authorities }: Props) {
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
        Promotion Queue — {authorities.length}
      </div>

      {authorities.length === 0 ? (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          No authorities ready for promotion. Add a source reference to a pending authority to begin.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {authorities.map((a, i) => (
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
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: GOLD,
                        opacity: 0.6,
                      }}
                    >
                      {confidenceLabel(a.authority_confidence)}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>→</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#4a9e6b",
                      }}
                    >
                      {nextConfidenceLevel(a.authority_confidence)}
                    </span>
                  </div>
                  {a.source_reference && (
                    <div style={{ fontSize: 11, color: GOLD, opacity: 0.6 }}>
                      {sourceDomain(a.source_reference)}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#4a9e6b",
                    background: "rgba(74,158,107,0.08)",
                    padding: "3px 8px",
                    borderRadius: 2,
                    flexShrink: 0,
                    border: "1px solid rgba(74,158,107,0.2)",
                  }}
                >
                  Ready
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
