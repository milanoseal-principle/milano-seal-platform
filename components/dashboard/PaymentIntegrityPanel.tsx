"use client";

import { evaluatePaymentIntegrity, type PaymentIntegrityMatter } from "@/lib/safety/payment-integrity";

interface PaymentIntegrityPanelProps {
  matter: PaymentIntegrityMatter;
}

const STATUS_COLOR: Record<string, string> = {
  "Payment Confirmed":      "rgba(100,200,120,0.8)",
  "Awaiting Payment":       "rgba(212,140,42,0.85)",
  "Scheduling Unlocked":    "rgba(100,200,120,0.8)",
  "Platform Fee Only":      "rgba(100,160,220,0.7)",
};

export function PaymentIntegrityPanel({ matter }: PaymentIntegrityPanelProps) {
  const gate = evaluatePaymentIntegrity(matter);

  return (
    <div
      data-critical-card=""
      style={{
        background: "rgba(6,13,20,0.65)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 6,
        padding: "14px 16px",
        marginTop: 10,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.55)",
          marginBottom: 10,
          fontFamily: "monospace",
        }}
      >
        Payment Integrity Gate
      </div>

      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: STATUS_COLOR[gate.statusLabel] ?? "rgba(160,160,160,0.5)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.82)",
            fontFamily: "monospace",
            letterSpacing: "0.06em",
          }}
        >
          {gate.statusLabel}
        </span>
      </div>

      {/* Gate states */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: gate.operatorNote ? 10 : 0 }}>
        {[
          { label: "Scheduling", allowed: gate.schedulingAllowed },
          { label: "Execution",  allowed: gate.executionAllowed  },
          { label: "Wise",       allowed: gate.showWise           },
        ].map(({ label, allowed }) => (
          <div
            key={label}
            style={{
              padding: "3px 10px",
              borderRadius: 4,
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.08em",
              background: allowed
                ? "rgba(100,200,120,0.12)"
                : "rgba(200,80,80,0.12)",
              color: allowed
                ? "rgba(100,200,120,0.85)"
                : "rgba(200,100,100,0.85)",
              border: `1px solid ${allowed ? "rgba(100,200,120,0.18)" : "rgba(200,80,80,0.18)"}`,
            }}
          >
            {label}: {allowed ? "UNLOCKED" : "LOCKED"}
          </div>
        ))}
      </div>

      {gate.operatorNote && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1.5,
          }}
        >
          {gate.operatorNote}
        </div>
      )}
    </div>
  );
}
