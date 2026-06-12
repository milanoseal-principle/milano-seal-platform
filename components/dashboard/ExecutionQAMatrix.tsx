"use client";

import {
  buildExecutionQAMatrix,
  evaluateQAMatrix,
  type QACheckStatus,
} from "@/lib/safety/execution-qa";

interface ExecutionQAMatrixProps {
  matter: {
    client_name?: string | null;
    destination_country?: string | null;
    document_type?: string | null;
    signer_name?: string | null;
    page_count?: number | null;
    expected_page_count?: number | null;
    has_notarial_block?: boolean;
    has_apostille_packet?: boolean;
    has_courier_packet?: boolean;
    identifier_lock_status?: "pending" | "matched" | "mismatched" | null;
    payment_confirmed?: boolean;
  };
}

const DOT_COLOR: Record<QACheckStatus, string> = {
  clear:            "rgba(100,200,120,0.8)",
  needs_review:     "rgba(212,140,42,0.85)",
  blocked:          "rgba(200,80,80,0.85)",
  founder_approved: "rgba(100,160,220,0.8)",
};

const STATUS_LABEL: Record<QACheckStatus, string> = {
  clear:            "Clear",
  needs_review:     "Review",
  blocked:          "Blocked",
  founder_approved: "Founder Override",
};

export function ExecutionQAMatrix({ matter }: ExecutionQAMatrixProps) {
  const checks = buildExecutionQAMatrix(matter);
  const result = evaluateQAMatrix(checks);

  const overallColor = DOT_COLOR[result.overallStatus];

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
          Execution QA
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            padding: "2px 8px",
            borderRadius: 4,
            background: `${overallColor.replace("0.8", "0.12").replace("0.85", "0.12")}`,
            color: overallColor,
          }}
        >
          {STATUS_LABEL[result.overallStatus]}
          {result.blockedCount > 0 && ` (${result.blockedCount})`}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {checks.map((check) => (
          <div
            key={check.key}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
              padding: "4px 0",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: DOT_COLOR[check.status],
                flexShrink: 0,
                marginTop: 3,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.72)",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {check.label}
              </div>
              {check.note && (
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(200,80,80,0.65)",
                    fontFamily: "system-ui, sans-serif",
                    marginTop: 2,
                  }}
                >
                  {check.note}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {result.requiresFounderOverride && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            background: "rgba(200,80,80,0.08)",
            borderRadius: 4,
            border: "1px solid rgba(200,80,80,0.18)",
            fontSize: 11,
            color: "rgba(200,80,80,0.75)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Founder override required before release can proceed.
        </div>
      )}
    </div>
  );
}
