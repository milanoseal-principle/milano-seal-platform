"use client";

import { Shield, CheckCircle, Circle } from "lucide-react";

interface Attestation {
  id: string;
  label: string;
  attested: boolean;
  attested_at?: string;
}

interface AllianceSecurityCenterProps {
  attestations?: Attestation[];
  onAttest?: (id: string) => void;
}

const DEFAULT_ATTESTATIONS: Attestation[] = [
  { id: "data_handling", label: "Data handling agreement reviewed", attested: false },
  { id: "confidentiality", label: "Client confidentiality understood", attested: false },
  { id: "secure_comms", label: "Secure communication protocols acknowledged", attested: false },
  { id: "no_disclosure", label: "No unauthorized matter disclosure", attested: false },
];

export function AllianceSecurityCenter({ attestations, onAttest }: AllianceSecurityCenterProps) {
  const items = attestations && attestations.length > 0 ? attestations : DEFAULT_ATTESTATIONS;
  const allComplete = items.every((a) => a.attested);

  return (
    <section
      style={{
        border: `1px solid ${allComplete ? "rgba(63,164,122,0.4)" : "rgba(198,165,90,0.24)"}`,
        borderRadius: 16,
        background: "#0B0B0B",
        padding: 24,
        transition: "border-color 0.4s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Shield size={18} color={allComplete ? "#3FA47A" : "#C6A55A"} />
        <div>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C6A55A" }}>
            / SECURITY CENTER /
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 500, color: "#F6F1E6" }}>
            Security Attestation
          </h2>
        </div>
      </div>

      {!allComplete && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(201,154,61,0.08)",
          border: "1px solid rgba(201,154,61,0.24)",
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 12,
          color: "#C99A3D",
          letterSpacing: "0.06em",
        }}>
          Security Attestation Required — complete all items before receiving client documents.
        </div>
      )}

      {allComplete && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(63,164,122,0.08)",
          border: "1px solid rgba(63,164,122,0.24)",
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 12,
          color: "#3FA47A",
          letterSpacing: "0.06em",
        }}>
          All security attestations complete.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((a) => (
          <div
            key={a.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 16px",
              background: a.attested ? "rgba(63,164,122,0.06)" : "rgba(198,165,90,0.04)",
              border: `1px solid ${a.attested ? "rgba(63,164,122,0.2)" : "rgba(198,165,90,0.14)"}`,
              borderRadius: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {a.attested
                ? <CheckCircle size={16} color="#3FA47A" />
                : <Circle size={16} color="rgba(198,165,90,0.4)" />
              }
              <span style={{ fontSize: 13, color: a.attested ? "#F6F1E6" : "#A8A29A" }}>
                {a.label}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {a.attested && a.attested_at && (
                <span style={{ fontSize: 10, color: "#3FA47A" }}>
                  {new Date(a.attested_at).toLocaleDateString()}
                </span>
              )}
              {!a.attested && onAttest && (
                <button
                  onClick={() => onAttest(a.id)}
                  style={{
                    padding: "5px 12px",
                    background: "transparent",
                    border: "1px solid rgba(198,165,90,0.4)",
                    borderRadius: 4,
                    color: "#C6A55A",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Attest
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
