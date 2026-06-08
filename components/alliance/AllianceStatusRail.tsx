const LIFECYCLE_STATES = [
  { key: "invited", label: "Invited" },
  { key: "profile_started", label: "Profile" },
  { key: "toolbelt_completed", label: "Tool Belt" },
  { key: "compliance_verified", label: "Compliance" },
  { key: "security_attested", label: "Security" },
  { key: "active", label: "Active" },
];

const STATUS_ORDER = [
  "invited",
  "profile_started",
  "identity_pending",
  "profile_completed",
  "toolbelt_started",
  "toolbelt_completed",
  "compliance_pending",
  "compliance_verified",
  "security_attested",
  "routing_eligible",
  "active",
  "paused",
  "suspended",
  "offboarded",
];

function getStepIndex(status: string): number {
  // Map detailed statuses to rail steps
  const idx = STATUS_ORDER.indexOf(status);
  if (idx <= 0) return 0;
  if (idx <= 2) return 1; // profile_started / identity_pending
  if (idx <= 5) return 2; // toolbelt
  if (idx <= 7) return 3; // compliance
  if (idx <= 8) return 4; // security
  return 5; // active+
}

interface AllianceStatusRailProps {
  status: string;
}

export function AllianceStatusRail({ status }: AllianceStatusRailProps) {
  const currentStep = getStepIndex(status);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        padding: "16px 0",
        overflowX: "auto",
      }}
    >
      {LIFECYCLE_STATES.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: done
                    ? "#C6A55A"
                    : active
                    ? "rgba(198,166,91,0.2)"
                    : "rgba(255,255,255,0.04)",
                  border: active
                    ? "2px solid #C6A55A"
                    : done
                    ? "2px solid #C6A55A"
                    : "2px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: done ? "#050505" : active ? "#C6A55A" : "#A8A29A",
                  flexShrink: 0,
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: active ? "#C6A55A" : done ? "#D8BE73" : "#A8A29A",
                  fontWeight: active ? 600 : 400,
                  whiteSpace: "nowrap",
                  letterSpacing: "0.05em",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < LIFECYCLE_STATES.length - 1 && (
              <div
                style={{
                  width: 40,
                  height: 1,
                  background: i < currentStep ? "#C6A55A" : "rgba(255,255,255,0.08)",
                  marginBottom: 16,
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
