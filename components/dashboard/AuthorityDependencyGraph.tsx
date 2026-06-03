"use client";

// Authority Dependency Graph — pure CSS/SVG chain visualization
// Shows authority -> workflow chain for selected country

interface StepNode {
  label: string;
  type: "authority" | "process" | "release";
  color: string;
}

interface ChainConfig {
  country: string;
  steps: StepNode[];
}

const CHAINS: ChainConfig[] = [
  {
    country: "Italy",
    steps: [
      { label: "State Notary / Court", type: "authority", color: "#C6A55A" },
      { label: "Secretary of State Apostille", type: "process", color: "#f59e0b" },
      { label: "Italian Consulate Authentication", type: "authority", color: "#C6A55A" },
      { label: "Translation (Certified)", type: "process", color: "#4a9e6b" },
      { label: "Release to Client", type: "release", color: "#4a9e6b" },
    ],
  },
  {
    country: "Portugal",
    steps: [
      { label: "State Notary / Court", type: "authority", color: "#C6A55A" },
      { label: "Secretary of State Apostille", type: "process", color: "#f59e0b" },
      { label: "Translation (if required)", type: "process", color: "#4a9e6b" },
      { label: "Release to Client", type: "release", color: "#4a9e6b" },
    ],
  },
  {
    country: "Mexico",
    steps: [
      { label: "State Notary / Court", type: "authority", color: "#C6A55A" },
      { label: "Secretary of State Apostille", type: "process", color: "#f59e0b" },
      { label: "Spanish Translation (Certified)", type: "process", color: "#4a9e6b" },
      { label: "Release to Client", type: "release", color: "#4a9e6b" },
    ],
  },
];

const DEFAULT_CHAIN: ChainConfig = {
  country: "Standard",
  steps: [
    { label: "Document Origination Authority", type: "authority", color: "#C6A55A" },
    { label: "Apostille Processing", type: "process", color: "#f59e0b" },
    { label: "Release to Client", type: "release", color: "#4a9e6b" },
  ],
};

export function AuthorityDependencyGraph({ country }: { country?: string }) {
  const chain = country
    ? (CHAINS.find((c) => c.country.toLowerCase() === country.toLowerCase()) ?? DEFAULT_CHAIN)
    : DEFAULT_CHAIN;

  return (
    <div
      style={{
        background: "rgba(3,3,5,0.9)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        padding: "20px 24px",
        marginTop: 20,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontFamily: "monospace",
          letterSpacing: "0.32em",
          textTransform: "uppercase" as const,
          color: "rgba(198,165,90,0.5)",
          marginBottom: 16,
        }}
      >
        Authority Dependency Chain — {country ?? "Standard Execution Path"}
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 0 }}>
        {chain.steps.map((step, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-start" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${step.color}30`,
                borderRadius: 2,
                minWidth: 280,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: step.color,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    color: step.color,
                    opacity: 0.7,
                    marginTop: 2,
                  }}
                >
                  {step.type}
                </div>
              </div>
            </div>
            {i < chain.steps.length - 1 && (
              <div
                style={{
                  marginLeft: 19,
                  width: 1,
                  height: 16,
                  background: "rgba(255,255,255,0.1)",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
