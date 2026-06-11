"use client";

import { getOperatorMatterSignals } from "@/lib/intelligence/client-guidance";

interface MatterIntelligencePanelProps {
  matter: {
    document_type?: string | null;
    destination_country?: string | null;
    assigned_lane?: string | null;
    matter_status?: string | null;
  };
}

const typeColors = {
  info: "rgba(100,160,220,0.7)",
  warning: "rgba(212,140,42,0.85)",
  suggestion: "rgba(100,180,120,0.7)",
} as const;

export function MatterIntelligencePanel({ matter }: MatterIntelligencePanelProps) {
  const signals = getOperatorMatterSignals({
    document_type: matter.document_type ?? null,
    destination_country: matter.destination_country ?? null,
    assigned_lane: matter.assigned_lane ?? null,
    matter_status: matter.matter_status ?? null,
  });

  if (signals.length === 0) return null;

  return (
    <div
      style={{
        background: "rgba(6,13,20,0.6)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 6,
        padding: "12px 14px",
        marginTop: 12,
      }}
    >
      <div
        style={{
          fontSize: 8,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.45)",
          marginBottom: 10,
        }}
      >
        Matter Signals
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {signals.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: typeColors[s.type],
                minWidth: 72,
                paddingTop: 1,
              }}
            >
              {s.label}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
