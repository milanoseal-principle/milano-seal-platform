import { Lock } from "lucide-react";

interface AllianceComplianceGateProps {
  toolbeltCompleted: boolean;
  complianceVerified: boolean;
  securityAttested: boolean;
  routingEligible: boolean;
  status: string;
}

export function AllianceComplianceGate({
  toolbeltCompleted,
  complianceVerified,
  securityAttested,
  routingEligible,
  status,
}: AllianceComplianceGateProps) {
  const isEligible =
    toolbeltCompleted &&
    complianceVerified &&
    securityAttested &&
    routingEligible &&
    status === "active";

  if (isEligible) return null;

  const blockers: string[] = [];
  if (!toolbeltCompleted) blockers.push("Tool Belt not completed");
  if (!complianceVerified) blockers.push("Compliance not verified");
  if (!securityAttested) blockers.push("Security attestation required");
  if (!routingEligible) blockers.push("Routing eligibility not granted");
  if (status !== "active") blockers.push("Account not yet active");

  return (
    <div
      style={{
        padding: "28px 24px",
        background: "rgba(184,92,92,0.06)",
        border: "1px solid rgba(184,92,92,0.2)",
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(184,92,92,0.1)",
          border: "1px solid rgba(184,92,92,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Lock size={20} color="#B85C5C" />
      </div>

      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#F6F1E6",
            marginBottom: 8,
          }}
        >
          Routing Locked
        </div>
        <p style={{ fontSize: 13, color: "#A8A29A", maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
          Complete compliance and security readiness to receive assigned matters.
        </p>
      </div>

      {blockers.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {blockers.map((b) => (
            <li
              key={b}
              style={{
                fontSize: 12,
                color: "rgba(184,92,92,0.8)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: "#B85C5C", flexShrink: 0 }} />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
