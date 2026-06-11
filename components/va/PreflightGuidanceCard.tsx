"use client";

import { getVAPreflightGuidance } from "@/lib/intelligence/client-guidance";

interface PreflightGuidanceCardProps {
  matter: {
    document_type?: string | null;
    destination_country?: string | null;
    matter_status?: string | null;
  };
}

export function PreflightGuidanceCard({ matter }: PreflightGuidanceCardProps) {
  const items = getVAPreflightGuidance({
    document_type: matter.document_type ?? null,
    destination_country: matter.destination_country ?? null,
    matter_status: matter.matter_status ?? null,
  });

  return (
    <div
      style={{
        background: "rgba(6,13,20,0.6)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 6,
        padding: "14px 16px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 8,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 12,
        }}
      >
        Pre-Flight Guidance
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.5,
              paddingBottom: 7,
              paddingLeft: 14,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 4,
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "rgba(198,165,90,0.45)",
                display: "block",
              }}
            />
            {item}
          </li>
        ))}
      </ul>
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 10,
          color: "rgba(198,165,90,0.5)",
          letterSpacing: "0.05em",
        }}
      >
        Pricing controls and final release require founder approval.
      </div>
    </div>
  );
}
