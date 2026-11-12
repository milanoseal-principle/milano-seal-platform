import { resolveAlliancePartner } from "@/lib/alliance/partnerContext";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import { AllianceComplianceGate } from "@/components/alliance/AllianceComplianceGate";
import { CheckCircle, AlertCircle, Shield } from "lucide-react";

const COMPLIANCE_ITEMS = [
  {
    key: "sop",
    title: "Alliance Standard Operating Procedures",
    desc: "Acknowledgment of Milano Seal execution SOPs and partner conduct guidelines.",
  },
  {
    key: "data",
    title: "Data Handling & Privacy Agreement",
    desc: "GDPR, CCPA, and international data protection compliance confirmation.",
  },
  {
    key: "docs",
    title: "Document Handling Protocol",
    desc: "Secure document transmission, storage, and destruction standards.",
  },
  {
    key: "sla",
    title: "Response SLA Agreement",
    desc: "Commitment to referral response and communication time standards.",
  },
  {
    key: "brand",
    title: "Brand & Representation Guidelines",
    desc: "Approved usage of Milano Seal brand marks, references, and co-branding.",
  },
];

export default async function AllianceCompliancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/alliance/login");

  const partner = await resolveAlliancePartner(user.id);

  const p = partner ?? {
    firm_name: null,
    contact_name: null,
    routing_eligible: false,
    toolbelt_completed: false,
    compliance_verified: false,
    security_attested: false,
    status: "invited",
  };

  return (
    <AllianceShell
      partnerName={p.contact_name ?? undefined}
      firmName={p.firm_name ?? undefined}
      routingEligible={p.routing_eligible ?? false}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 680 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
            Legal &amp; Operational Standards
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 8px" }}>
            Compliance Gate
          </h1>
          <p style={{ fontSize: 13, color: "#A8A29A", margin: 0, lineHeight: 1.6 }}>
            All compliance requirements must be confirmed before routing eligibility is granted. Compliance status is re-evaluated periodically to maintain network integrity.
          </p>
        </div>

        {/* Overall status */}
        <div
          style={{
            padding: "20px 24px",
            background: "#0d0d0d",
            border: `1px solid ${p.compliance_verified ? "rgba(63,164,122,0.25)" : "rgba(201,154,61,0.2)"}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: p.compliance_verified ? "rgba(63,164,122,0.1)" : "rgba(201,154,61,0.08)",
              border: `1px solid ${p.compliance_verified ? "rgba(63,164,122,0.3)" : "rgba(201,154,61,0.25)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={20} color={p.compliance_verified ? "#3FA47A" : "#C99A3D"} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#F6F1E6" }}>
              {p.compliance_verified ? "Compliance Verified" : "Compliance Review Pending"}
            </div>
            <div style={{ fontSize: 12, color: "#A8A29A", marginTop: 4, lineHeight: 1.5 }}>
              {p.compliance_verified
                ? "All compliance requirements confirmed. Routing eligibility active."
                : "Complete the onboarding flow to initiate compliance review."}
            </div>
          </div>
        </div>

        {/* Routing gate */}
        <AllianceComplianceGate
          toolbeltCompleted={p.toolbelt_completed ?? false}
          complianceVerified={p.compliance_verified ?? false}
          securityAttested={p.security_attested ?? false}
          routingEligible={p.routing_eligible ?? false}
          status={p.status}
        />

        {/* Compliance checklist */}
        <div style={{ background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.12)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(198,166,91,0.08)" }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A" }}>
              Compliance Checklist
            </div>
          </div>
          {COMPLIANCE_ITEMS.map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ marginTop: 2 }}>
                {p.compliance_verified ? (
                  <CheckCircle size={16} color="#3FA47A" />
                ) : (
                  <AlertCircle size={16} color="rgba(255,255,255,0.15)" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#F6F1E6", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#A8A29A", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  background: p.compliance_verified ? "rgba(63,164,122,0.08)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${p.compliance_verified ? "rgba(63,164,122,0.25)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 3,
                  color: p.compliance_verified ? "#3FA47A" : "#A8A29A",
                  flexShrink: 0,
                }}
              >
                {p.compliance_verified ? "Confirmed" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AllianceShell>
  );
}
