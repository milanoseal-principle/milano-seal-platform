import { CheckCircle, Lock, AlertTriangle } from "lucide-react";

export type ToolbeltModuleStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "expired"
  | "review_required";

interface ToolbeltModule {
  key: string;
  label: string;
  description: string;
  order: number;
}

const MODULES: ToolbeltModule[] = [
  { key: "identity", label: "Identity", description: "Verify your professional identity and legal standing.", order: 1 },
  { key: "service_scope", label: "Service Scope", description: "Define jurisdictions and document categories.", order: 2 },
  { key: "document_handling", label: "Document Handling", description: "Confirm secure document transmission and storage protocols.", order: 3 },
  { key: "compliance", label: "Compliance", description: "Review and confirm Alliance SOPs and data handling requirements.", order: 4 },
  { key: "client_communication", label: "Client Communication", description: "Review client handoff and communication standards.", order: 5 },
  { key: "referral_routing", label: "Referral Routing", description: "Understand referral workflows and routing procedures.", order: 6 },
  { key: "security_attestation", label: "Security Attestation", description: "Attest to your security controls and incident response readiness.", order: 7 },
  { key: "routing_eligibility", label: "Routing Eligibility", description: "Final review for matter routing activation.", order: 8 },
];

interface AllianceToolbeltMatrixProps {
  progress: Record<string, ToolbeltModuleStatus>;
}

function getStatusStyle(status: ToolbeltModuleStatus, locked: boolean) {
  if (locked) {
    return {
      bg: "rgba(255,255,255,0.02)",
      border: "rgba(255,255,255,0.06)",
      labelColor: "#A8A29A",
      opacity: 0.5,
    };
  }
  switch (status) {
    case "approved":
      return { bg: "rgba(63,164,122,0.06)", border: "rgba(63,164,122,0.2)", labelColor: "#3FA47A", opacity: 1 };
    case "review_required":
      return { bg: "rgba(201,154,61,0.08)", border: "rgba(201,154,61,0.3)", labelColor: "#C99A3D", opacity: 1 };
    case "submitted":
    case "in_progress":
      return { bg: "rgba(198,166,91,0.05)", border: "rgba(198,166,91,0.2)", labelColor: "#C6A55A", opacity: 1 };
    case "rejected":
      return { bg: "rgba(184,92,92,0.06)", border: "rgba(184,92,92,0.2)", labelColor: "#B85C5C", opacity: 1 };
    default:
      return { bg: "#111111", border: "rgba(198,166,91,0.14)", labelColor: "#F6F1E6", opacity: 1 };
  }
}

function StatusIcon({ status, locked }: { status: ToolbeltModuleStatus; locked: boolean }) {
  if (locked) return <Lock size={14} color="#A8A29A" />;
  if (status === "approved") return <CheckCircle size={14} color="#3FA47A" />;
  if (status === "review_required") return <AlertTriangle size={14} color="#C99A3D" />;
  if (status === "rejected") return <AlertTriangle size={14} color="#B85C5C" />;
  return null;
}

function StatusBadge({ status, locked }: { status: ToolbeltModuleStatus; locked: boolean }) {
  if (locked) return <span style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.1em", color: "#A8A29A", textTransform: "uppercase" }}>Locked</span>;
  const labels: Record<ToolbeltModuleStatus, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    submitted: "Submitted",
    approved: "Approved",
    rejected: "Rejected",
    expired: "Expired",
    review_required: "Needs Review",
  };
  const colors: Record<ToolbeltModuleStatus, string> = {
    not_started: "#A8A29A",
    in_progress: "#C6A55A",
    submitted: "#C6A55A",
    approved: "#3FA47A",
    rejected: "#B85C5C",
    expired: "#B85C5C",
    review_required: "#C99A3D",
  };
  return (
    <span style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.1em", color: colors[status], textTransform: "uppercase" }}>
      {labels[status]}
    </span>
  );
}

export function AllianceToolbeltMatrix({ progress }: AllianceToolbeltMatrixProps) {
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {MODULES.map((mod, i) => {
          const status = progress[mod.key] ?? "not_started";
          // Modules unlock in sequence: a module is locked if the previous one isn't approved
          const prevKey = i > 0 ? MODULES[i - 1].key : null;
          const prevStatus = prevKey ? (progress[prevKey] ?? "not_started") : "approved";
          const locked = i > 0 && prevStatus !== "approved";
          const style = getStatusStyle(status, locked);

          return (
            <div
              key={mod.key}
              style={{
                padding: "20px",
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: 8,
                opacity: style.opacity,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#A8A29A",
                  }}
                >
                  {mod.order.toString().padStart(2, "0")}
                </span>
                <StatusIcon status={status} locked={locked} />
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: locked ? "#A8A29A" : "#F6F1E6", marginBottom: 6 }}>
                  {mod.label}
                </div>
                <p style={{ fontSize: 12, color: "#A8A29A", lineHeight: 1.5, margin: 0 }}>
                  {mod.description}
                </p>
              </div>

              <StatusBadge status={status} locked={locked} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
