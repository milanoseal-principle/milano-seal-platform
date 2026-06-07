<<<<<<< HEAD
import { requireAllianceAccess } from "@/lib/allianceAuth";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import { PartnerCertificationFlow } from "@/components/alliance/PartnerCertificationFlow";

export const dynamic = "force-dynamic";

export const metadata = {
=======
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
>>>>>>> claude/funny-maxwell-hlxQN
  title: "Partner Certification | The Milano Seal™",
  robots: { index: false, follow: false },
};

<<<<<<< HEAD
export default async function PartnerCertificationPage() {
  await requireAllianceAccess();

  return (
    <AllianceShell>
      <PartnerCertificationFlow />
    </AllianceShell>
=======
const STEPS = [
  { key: "step_1_identity", label: "Identity Verification", description: "Confirm business identity and legal standing." },
  { key: "step_2_service_scope", label: "Service Scope Agreement", description: "Define the scope of services you will refer." },
  { key: "step_3_document_handling", label: "Document Handling Standards", description: "Attest to secure document handling practices." },
  { key: "step_4_client_communication", label: "Client Communication Policy", description: "Review and acknowledge client communication standards." },
  { key: "step_5_referral_routing", label: "Referral Routing Protocol", description: "Understand how referrals are routed and tracked." },
  { key: "step_6_security_attestation", label: "Security Attestation", description: "Attest to data security and confidentiality requirements." },
  { key: "step_7_compliance_acknowledgement", label: "Compliance Acknowledgement", description: "Acknowledge all compliance requirements." },
];

export default async function CertificationPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "alliance") redirect("/alliance/dashboard");

  // Fetch only own certification record
  const { data: cert } = await supabase
    .from("partner_certifications")
    .select("step_1_identity,step_2_service_scope,step_3_document_handling,step_4_client_communication,step_5_referral_routing,step_6_security_attestation,step_7_compliance_acknowledgement,routing_status,operator_approved_at")
    .eq("partner_id", user.id)
    .single();

  const completedCount = cert
    ? STEPS.filter(s => cert[s.key as keyof typeof cert] === true).length
    : 0;
  const allStepsDone = completedCount === 7;
  const routingStatus = cert?.routing_status ?? "ROUTING_LOCKED";

  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: "rgba(212,175,55,0.5)" }}>
          Alliance · Partner Certification
        </p>
        <h1 className="font-serif text-2xl text-white tracking-wide mb-1">Tool Belt Certification</h1>
        <p className="font-mono text-xs mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
          Complete all 7 steps. Routing eligibility is granted by operator review — not automatic.
        </p>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.5)" }}>Progress</span>
            <span className="font-mono text-[10px]" style={{ color: "#D4AF37" }}>{completedCount} / 7</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: "rgba(212,175,55,0.15)" }}>
            <div className="h-1 rounded-full transition-all" style={{ width: `${(completedCount / 7) * 100}%`, background: "#D4AF37" }} />
          </div>
        </div>

        {/* Routing Status */}
        <div className="mb-8 rounded border px-5 py-4" style={{ borderColor: "rgba(212,175,55,0.15)", background: "rgba(255,255,255,0.02)" }}>
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(212,175,55,0.4)" }}>Routing Status</p>
          <p className="font-mono text-sm font-semibold" style={{
            color: routingStatus === "ACTIVE_PARTNER" ? "#22c55e" : routingStatus === "ROUTING_ELIGIBLE" ? "#D4AF37" : "#f59e0b"
          }}>
            {routingStatus.replace(/_/g, " ")}
          </p>
          {routingStatus === "ROUTING_LOCKED" && (
            <p className="font-mono text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
              Complete all steps and await operator approval to become routing eligible.
            </p>
          )}
          {routingStatus === "ROUTING_ELIGIBLE" && !cert?.operator_approved_at && (
            <p className="font-mono text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
              Awaiting operator review and approval.
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const done = cert?.[step.key as keyof typeof cert] === true;
            return (
              <div key={step.key} className="rounded border px-5 py-4 flex items-start gap-4"
                style={{ borderColor: done ? "rgba(34,197,94,0.25)" : "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-mono font-bold"
                  style={{ background: done ? "rgba(34,197,94,0.15)" : "rgba(212,175,55,0.08)", border: `1px solid ${done ? "rgba(34,197,94,0.4)" : "rgba(212,175,55,0.2)"}`, color: done ? "#22c55e" : "#D4AF37" }}>
                  {done ? "✓" : i + 1}
                </div>
                <div>
                  <p className="font-mono text-[11px] font-semibold mb-0.5" style={{ color: done ? "#22c55e" : "rgba(255,255,255,0.8)" }}>{step.label}</p>
                  <p className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {allStepsDone && routingStatus === "ROUTING_LOCKED" && (
          <div className="mt-6 rounded border px-5 py-4" style={{ borderColor: "rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.05)" }}>
            <p className="font-mono text-xs" style={{ color: "#D4AF37" }}>
              All steps complete. Your application is under operator review. You will be notified when routing eligibility is granted.
            </p>
          </div>
        )}
      </div>
    </div>
>>>>>>> claude/funny-maxwell-hlxQN
  );
}
