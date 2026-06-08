"use client";
import React, { useState } from "react";
import type { DocumentGovernanceRecord } from "@/lib/documents/documentGovernance";
import { getClientSafeDocumentStatus } from "@/lib/documents/documentLifecycle";

interface Props {
  records: DocumentGovernanceRecord[];
  onAction?: (recordId: string, action: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  RELEASED: "rgba(34,197,94,0.8)",
  APOSTILLE_COMPLETED: "rgba(34,197,94,0.6)",
  READY_FOR_RELEASE: "rgba(212,175,55,0.9)",
  EXECUTION_READY: "rgba(212,175,55,0.7)",
  NOTARIZED: "rgba(212,175,55,0.7)",
  TRANSLATION_REQUIRED: "rgba(251,146,60,0.8)",
  AUTHENTICATION_REQUIRED: "rgba(251,146,60,0.8)",
  CONSULAR_REVIEW_REQUIRED: "rgba(251,146,60,0.8)",
  NEEDS_REVIEW: "rgba(251,146,60,0.8)",
  REJECTED: "rgba(239,68,68,0.8)",
  EXPIRED: "rgba(239,68,68,0.8)",
};

export function DocumentLifecyclePanel({ records, onAction }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!records.length) {
    return (
      <div style={{ padding: "32px 24px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
        No document lifecycle records for this matter.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {records.map((rec, i) => {
        const color = STATUS_COLOR[rec.lifecycleStatus] ?? "rgba(255,255,255,0.4)";
        const isOpen = expanded === (rec.documentId ?? String(i));
        return (
          <div key={rec.documentId ?? i}
            style={{
              background: "rgba(12,12,18,0.96)",
              border: "1px solid rgba(212,175,55,0.14)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Row */}
            <button
              onClick={() => setExpanded(isOpen ? null : (rec.documentId ?? String(i)))}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", background: "none", border: "none", cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: "#fff", fontWeight: 500 }}>
                {rec.documentType ?? "Document"} {rec.destinationCountry ? `→ ${rec.destinationCountry}` : ""}
              </span>
              <span style={{ fontSize: 11, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {rec.lifecycleStatus.replace(/_/g, " ")}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>{isOpen ? "▲" : "▼"}</span>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div style={{ padding: "12px 16px 16px", borderTop: "1px solid rgba(212,175,55,0.08)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 12 }}>
                  {[
                    ["Validity", rec.validityStatus],
                    ["Client Status", rec.clientSafeStatus],
                    ["Apostille", rec.apostilleRequired ? "Required" : "Not Required"],
                    ["Authentication", rec.authenticationRequired ? "Required" : "Not Required"],
                    ["Translation", rec.translationRequired ? "Required" : "Not Required"],
                    ["Manual Review", rec.manualReviewRequired ? "Yes" : "No"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{value}</div>
                    </div>
                  ))}
                </div>
                {rec.clientSafeSummary && (
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12, lineHeight: 1.5 }}>
                    {rec.clientSafeSummary}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Mark Reviewed", "Flag Translation", "Flag Authentication", "Mark Execution Ready", "Archive"].map((action) => (
                    <button key={action}
                      onClick={() => onAction?.(rec.documentId ?? String(i), action)}
                      style={{
                        fontSize: 10, padding: "5px 10px", borderRadius: 4, cursor: "pointer",
                        background: "rgba(212,175,55,0.10)", border: "1px solid rgba(212,175,55,0.25)",
                        color: "rgba(212,175,55,0.8)", letterSpacing: "0.06em", textTransform: "uppercase",
                      }}
                    >{action}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
