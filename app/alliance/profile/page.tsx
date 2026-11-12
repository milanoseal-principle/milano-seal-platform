import { resolveAlliancePartner } from "@/lib/alliance/partnerContext";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import { AllianceReadinessScore } from "@/components/alliance/AllianceReadinessScore";
import { AllianceStatusRail } from "@/components/alliance/AllianceStatusRail";

export default async function AllianceProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/alliance/login");

  const partner = await resolveAlliancePartner(user.id);

  const p = partner ?? {
    firm_name: null,
    contact_name: null,
    email: user.email,
    partner_type: null,
    status: "invited",
    toolbelt_completed: false,
    compliance_verified: false,
    security_attested: false,
    routing_eligible: false,
    jurisdiction_codes: [],
    document_categories: [],
    partner_code: null,
    created_at: null,
  };

  return (
    <AllianceShell
      partnerName={p.contact_name ?? undefined}
      firmName={p.firm_name ?? undefined}
      routingEligible={p.routing_eligible ?? false}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
            Alliance Portal
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 8px" }}>
            Partner Profile
          </h1>
        </div>

        {/* Status rail */}
        <div style={{ padding: "20px", background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.14)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 16 }}>
            Account Lifecycle
          </div>
          <AllianceStatusRail status={p.status} />
        </div>

        {/* Readiness */}
        <AllianceReadinessScore
          profileComplete={!!(p.contact_name && p.email)}
          toolbeltCompleted={p.toolbelt_completed ?? false}
          complianceVerified={p.compliance_verified ?? false}
          securityAttested={p.security_attested ?? false}
          routingEligible={p.routing_eligible ?? false}
        />

        {/* Partner details */}
        <div style={{ padding: "24px", background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.14)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 20 }}>
            Partner Details
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Contact Name", value: p.contact_name ?? "—" },
              { label: "Firm / Organization", value: p.firm_name ?? "—" },
              { label: "Email", value: p.email ?? "—" },
              { label: "Partner Type", value: p.partner_type ? p.partner_type.replace(/_/g, " ") : "—" },
              { label: "Partner Code", value: p.partner_code ?? "—" },
              { label: "Account Status", value: p.status },
              { label: "Jurisdictions", value: (p.jurisdiction_codes ?? []).join(", ") || "—" },
              { label: "Document Categories", value: (p.document_categories ?? []).join(", ") || "—" },
              { label: "Member Since", value: p.created_at ? new Date(p.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 24, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 12, color: "#A8A29A", fontFamily: "monospace", letterSpacing: "0.06em" }}>{row.label}</span>
                <span style={{ fontSize: 13, color: "#F6F1E6", textAlign: "right", maxWidth: "60%" }}>{row.value}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#A8A29A", marginTop: 20, marginBottom: 0 }}>
            To update your profile, contact the Milano Seal team via the Support section.
          </p>
        </div>
      </div>
    </AllianceShell>
  );
}
