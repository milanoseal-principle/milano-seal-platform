"use client";

import type { ChainCertificationResult, ChainCertificationStatus } from "@/lib/authorityChainCertification";

const GOLD = "#C6A55A";
const RED = "#e05252";
const EMERALD = "#4a9e6b";
const DIM = "#5A5A5A";

interface Props {
  results: ChainCertificationResult[];
}

function statusDotColor(status: ChainCertificationStatus): string {
  switch (status) {
    case "CERTIFIED": return EMERALD;
    case "HIGH_CONFIDENCE": return GOLD;
    case "DEVELOPING": return `${GOLD}99`;
    case "INCOMPLETE": return RED;
    case "DEMOTED": return RED;
    case "NO_CHAIN": return DIM;
  }
}

function statusLabel(status: ChainCertificationStatus): string {
  switch (status) {
    case "CERTIFIED": return "CERTIFIED";
    case "HIGH_CONFIDENCE": return "HIGH CONFIDENCE";
    case "DEVELOPING": return "DEVELOPING";
    case "INCOMPLETE": return "INCOMPLETE";
    case "DEMOTED": return "DEMOTED";
    case "NO_CHAIN": return "NO CHAIN";
  }
}

export function ChainCertificationPanel({ results }: Props) {
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
        Chain Certification
      </div>

      {results.length === 0 ? (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
          No authority chains defined. Add dependency records to see chain certification.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {results.map((r, i) => {
            const dotColor = statusDotColor(r.status);
            const chainNames = r.chain.chain.map((s) => s.authority_name).join(" → ");
            const docLabel = r.document_type_slug
              ? r.document_type_slug.replace(/-/g, " ").toUpperCase()
              : "ALL DOCUMENTS";

            return (
              <div
                key={`${r.country}-${r.document_type_slug ?? "null"}-${i}`}
                style={{
                  padding: "12px 0",
                  borderBottom:
                    i < results.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 5,
                  }}
                >
                  {/* Status dot */}
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: dotColor,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.85)",
                      fontFamily: "monospace",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {docLabel} — {r.country}
                  </div>
                  <div
                    style={{
                      marginLeft: "auto",
                      fontSize: 9,
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                      color: dotColor,
                      flexShrink: 0,
                    }}
                  >
                    {statusLabel(r.status)}
                  </div>
                </div>

                {/* Chain display */}
                {r.chain_length > 0 ? (
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.45)",
                      marginBottom: 3,
                      paddingLeft: 15,
                    }}
                  >
                    {chainNames}
                  </div>
                ) : null}

                {/* Score + certified steps */}
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    paddingLeft: 15,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "monospace",
                    marginBottom: r.bottleneck_authority ? 3 : 0,
                  }}
                >
                  <span>Score: {r.execution_confidence_score}/100</span>
                  {r.chain_length > 0 && (
                    <span>
                      {r.certified_steps} of {r.chain_length} certified
                    </span>
                  )}
                </div>

                {/* Bottleneck */}
                {r.bottleneck_authority && r.status !== "CERTIFIED" && (
                  <div
                    style={{
                      paddingLeft: 15,
                      fontSize: 10,
                      color: RED,
                      fontFamily: "monospace",
                    }}
                  >
                    Bottleneck: {r.bottleneck_authority} ({r.lowest_confidence})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
