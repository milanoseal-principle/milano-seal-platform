"use client";

import { isHagueMember } from "@/lib/intake/hagueMembers";
import { getLanguageRouting } from "@/lib/hague-countries";

interface TrustModeProps {
  destinationCountry: string | null;
  apostilleRequired: boolean;
  translationRequired: boolean;
  signerCount: number;
  originState: string | null;
  dealStatus: string;
  paymentStatus: string;
}

const GATE_STATUS = {
  done: { color: "#4a9e6b", icon: "✓" },
  active: { color: "#C6A55A", icon: "●" },
  blocked: { color: "#c05050", icon: "✕" },
  pending: { color: "rgba(255,255,255,0.28)", icon: "○" },
};

type GateState = keyof typeof GATE_STATUS;

interface GateRow {
  label: string;
  state: GateState;
  detail?: string;
}

function resolvePaymentGate(paymentStatus: string, dealStatus: string): GateState {
  if (paymentStatus === "paid" || paymentStatus === "confirmed") return "done";
  if (dealStatus === "payment_confirmed") return "done";
  if (dealStatus === "awaiting_payment" || dealStatus === "quoted") return "active";
  return "pending";
}

function resolveSchedulingGate(dealStatus: string, paymentStatus: string): GateState {
  const paid = paymentStatus === "paid" || paymentStatus === "confirmed";
  if (["scheduled", "in_execution", "apostille_processing", "courier_ready", "shipped", "delivered", "completed", "closed"].includes(dealStatus)) return "done";
  if (dealStatus === "payment_confirmed" || (paid && dealStatus !== "awaiting_payment")) return "active";
  return "pending";
}

function resolveExecutionGate(dealStatus: string): GateState {
  if (["apostille_processing", "courier_ready", "shipped", "delivered", "completed", "closed"].includes(dealStatus)) return "done";
  if (["in_execution"].includes(dealStatus)) return "active";
  if (["scheduled"].includes(dealStatus)) return "active";
  return "pending";
}

function resolveReleaseGate(dealStatus: string): GateState {
  if (["completed", "closed"].includes(dealStatus)) return "done";
  if (["shipped", "delivered"].includes(dealStatus)) return "active";
  if (["courier_ready"].includes(dealStatus)) return "active";
  return "pending";
}

export function TrustModeGuide({
  destinationCountry,
  apostilleRequired,
  translationRequired,
  signerCount,
  originState,
  dealStatus,
  paymentStatus,
}: TrustModeProps) {
  const country = destinationCountry ?? "";
  const hague = isHagueMember(country);
  const langRouting = country ? getLanguageRouting(country) : null;

  const paymentGate = resolvePaymentGate(paymentStatus, dealStatus);
  const schedulingGate = resolveSchedulingGate(dealStatus, paymentStatus);
  const executionGate = resolveExecutionGate(dealStatus);
  const releaseGate = resolveReleaseGate(dealStatus);

  const jurisdictionRows: GateRow[] = [
    {
      label: "Hague Convention",
      state: country ? (hague ? "done" : "active") : "pending",
      detail: !country
        ? "Destination not set"
        : hague
        ? "Apostille path"
        : "Legalization chain required",
    },
    {
      label: "Apostille Required",
      state: apostilleRequired ? "active" : "pending",
      detail: apostilleRequired
        ? `Issued by ${originState ?? "issuing state"} Secretary of State`
        : "Not flagged",
    },
    {
      label: "Translation",
      state: translationRequired ? "active" : "pending",
      detail: translationRequired
        ? langRouting
          ? `${langRouting.officialLanguages.join(" / ")} — review before release`
          : "Language TBD — manual review recommended"
        : langRouting?.translationLikely
        ? `${langRouting.officialLanguages.join(" / ")} — likely required, not flagged`
        : "Not flagged",
    },
    {
      label: "Signers",
      state: signerCount > 0 ? "done" : "pending",
      detail: signerCount === 1
        ? "1 signer"
        : signerCount > 1
        ? `${signerCount} signers — all must be present`
        : "Not set",
    },
  ];

  const executionRows: GateRow[] = [
    { label: "Payment Confirmed", state: paymentGate, detail: paymentGate === "done" ? "Cleared" : paymentGate === "active" ? "Pending — scheduling locked" : "Not reached" },
    { label: "Scheduling Unlocked", state: schedulingGate, detail: schedulingGate === "done" ? "Session booked" : schedulingGate === "active" ? "Payment confirmed — schedule now" : "Awaiting payment" },
    { label: "Execution", state: executionGate, detail: executionGate === "done" ? "Complete" : executionGate === "active" ? "In progress" : "Not reached" },
    { label: "Courier Release", state: releaseGate, detail: releaseGate === "done" ? "Released" : releaseGate === "active" ? "In courier flow" : "Not reached" },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(198,165,90,0.04) 0%, rgba(0,0,0,0) 100%), #141414",
        border: "1px solid rgba(198,165,90,0.22)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(198,165,90,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#C6A55A",
              fontWeight: 700,
              marginBottom: 2,
            }}
          >
            Trust Mode™
          </div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.06em",
            }}
          >
            Execution intelligence
          </div>
        </div>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#C6A55A",
            opacity: 0.8,
            animation: "tmPulse 2.8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Jurisdiction */}
      <div style={{ padding: "10px 16px 0" }}>
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Jurisdiction
        </div>
        {jurisdictionRows.map((row) => {
          const g = GATE_STATUS[row.state];
          return (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                paddingBottom: 8,
                marginBottom: 6,
                borderBottom: "1px solid rgba(198,165,90,0.06)",
              }}
            >
              <span
                style={{
                  color: g.color,
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 1,
                  width: 12,
                  textAlign: "center",
                }}
              >
                {g.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: row.state === "pending" ? "rgba(255,255,255,0.35)" : "#fff",
                    marginBottom: row.detail ? 2 : 0,
                  }}
                >
                  {row.label}
                </div>
                {row.detail && (
                  <div
                    style={{
                      fontSize: 10,
                      color: row.state === "done" ? "rgba(74,158,107,0.8)" : row.state === "active" ? "rgba(198,165,90,0.75)" : "rgba(255,255,255,0.3)",
                      lineHeight: 1.4,
                    }}
                  >
                    {row.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution gates */}
      <div style={{ padding: "10px 16px 12px" }}>
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Execution Gates
        </div>
        {executionRows.map((row) => {
          const g = GATE_STATUS[row.state];
          return (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                paddingBottom: 6,
                marginBottom: 5,
                borderBottom: "1px solid rgba(198,165,90,0.06)",
              }}
            >
              <span
                style={{
                  color: g.color,
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 1,
                  width: 12,
                  textAlign: "center",
                }}
              >
                {g.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: row.state === "pending" ? "rgba(255,255,255,0.3)" : "#fff",
                    marginBottom: row.detail ? 2 : 0,
                  }}
                >
                  {row.label}
                </div>
                {row.detail && (
                  <div
                    style={{
                      fontSize: 10,
                      color:
                        row.state === "done"
                          ? "rgba(74,158,107,0.8)"
                          : row.state === "active"
                          ? "rgba(198,165,90,0.75)"
                          : "rgba(255,255,255,0.28)",
                    }}
                  >
                    {row.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes tmPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
