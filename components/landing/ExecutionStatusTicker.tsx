"use client";

const TERMS = [
  "GLOBAL DOCUMENT INTELLIGENCE",
  "HAGUE ROUTE REVIEW",
  "PAYMENT-GATED EXECUTION",
  "CHAIN-OF-CUSTODY VISIBILITY",
  "WISE PAYMENT REFERENCE",
  "COURIER RELEASE TRACKING",
  "PRE-FLIGHT REVIEW",
  "DOCUMENT VAULT",
  "PAID & RELEASED",
  "APOSTILLE COORDINATION",
  "INTERNATIONAL DOCUMENT COORDINATION",
];

export function ExecutionStatusTicker() {
  // CSS marquee — no JS animation, no fake numbers
  const repeated = [...TERMS, ...TERMS];
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(198,165,90,0.1)",
        background: "rgba(8,5,1,0.95)",
        overflow: "hidden",
        padding: "8px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 48,
          animation: "ticker 40s linear infinite",
          whiteSpace: "nowrap",
          width: "max-content",
        }}
      >
        {repeated.map((term, i) => (
          <span key={i} style={{ color: "rgba(198,165,90,0.5)", fontSize: 10, letterSpacing: "0.12em" }}>
            {term}
            <span style={{ color: "rgba(198,165,90,0.2)", marginLeft: 48 }}>·</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
