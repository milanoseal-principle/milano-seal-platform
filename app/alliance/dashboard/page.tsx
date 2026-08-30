import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import { AllianceStatusRail } from "@/components/alliance/AllianceStatusRail";
import { AllianceReadinessScore } from "@/components/alliance/AllianceReadinessScore";
import { AllianceComplianceGate } from "@/components/alliance/AllianceComplianceGate";
import { AllianceActivityLedger } from "@/components/alliance/AllianceActivityLedger";
import { FileStack, GitBranch, Link2, Wallet } from "lucide-react";
import { allianceDashboardModules } from "@/lib/modules/allianceDashboardModules";

async function getPartnerData(userId: string) {
  const supabase = await createClient();
  const { data: partner } = await supabase
    .from("alliance_partners")
    .select("*")
    .eq("user_id", userId)
    .single();

  const p = partner ?? {
    id: null,
    firm_name: null,
    contact_name: null,
    email: null,
    partner_code: null,
    status: "invited",
    toolbelt_completed: false,
    compliance_verified: false,
    security_attested: false,
    routing_eligible: false,
  };

  let referralCount = 0;
  if (p.id) {
    const { count } = await supabase
      .from("referral_ledger")
      .select("id", { count: "exact", head: true })
      .eq("partner_id", p.id);
    referralCount = count ?? 0;
  }

  return { partner: p, referralCount };
}

export default async function AllianceDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/alliance/login");

  const { partner: p, referralCount } = await getPartnerData(user.id);
  const isRoutingEligible =
    (p.toolbelt_completed ?? false) &&
    (p.compliance_verified ?? false) &&
    (p.security_attested ?? false) &&
    (p.routing_eligible ?? false) &&
    p.status === "active";

  const designation = isRoutingEligible
    ? "Milano Verified Execution Partner™"
    : "Milano Alliance Candidate";

  return (
    <AllianceShell
      partnerName={p.contact_name ?? undefined}
      firmName={p.firm_name ?? undefined}
      routingEligible={isRoutingEligible}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1100 }}>
        <div style={{ position: "relative", overflow: "hidden", padding: 24, background: "linear-gradient(135deg, rgba(198,166,91,0.06), rgba(13,13,13,0.96) 42%)", border: "1px solid rgba(198,166,91,0.14)", borderRadius: 12 }}>
          <div style={{ position: "absolute", top: 0, left: 40, right: 40, height: 1, background: "linear-gradient(90deg, transparent, rgba(198,166,91,0.65), transparent)" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ maxWidth: 720 }}>
              <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(198,166,91,0.62)", marginBottom: 8 }}>
                THE MILANO SEAL™ · EXECUTION NETWORK
              </div>
              <h1 style={{ fontSize: 29, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 8px" }}>
                Execution Partner Workspace
              </h1>
              <p style={{ fontSize: 13, color: "#A8A29A", margin: 0, lineHeight: 1.65 }}>
                Structured Matter assignments, verified readiness, governed execution resources, referral attribution, performance visibility, and payout status—without creating a second Matter or pricing authority.
              </p>
            </div>
            <div style={{ minWidth: 240, padding: "14px 16px", borderRadius: 10, background: "rgba(0,0,0,0.28)", border: `1px solid ${isRoutingEligible ? "rgba(63,164,122,0.28)" : "rgba(198,166,91,0.16)"}` }}>
              <div style={{ fontSize: 8, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "#A8A29A" }}>Network designation</div>
              <div style={{ marginTop: 6, fontSize: 13, color: isRoutingEligible ? "#76D3A7" : "#D8C188", fontWeight: 600 }}>{designation}</div>
              <div style={{ marginTop: 5, fontSize: 9, lineHeight: 1.5, color: "rgba(168,162,154,0.55)" }}>
                {isRoutingEligible ? "Earned from active status + Tool Belt + compliance + security + routing eligibility." : "Complete the governed readiness gates to earn verified routing status."}
              </div>
            </div>
          </div>
          <div className="sr-only">{p.firm_name ?? p.contact_name ?? "Welcome"} · {allianceDashboardModules.join(",")}</div>
        </div>

        <div style={{ padding: "20px 24px", background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.12)", borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 16 }}>Account Lifecycle</div>
          <AllianceStatusRail status={p.status} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[
            { icon: GitBranch, label: "Total Referrals", value: referralCount.toString(), sub: "All time" },
            { icon: FileStack, label: "Active Matters", value: "—", sub: "In queue" },
            { icon: Wallet, label: "Outstanding Commission", value: "—", sub: "Pending review" },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} style={{ padding: "20px", background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.12)", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(198,166,91,0.06)", border: "1px solid rgba(198,166,91,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} color="#C6A55A" />
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: "#F6F1E6", marginBottom: 4 }}>{m.value}</div>
                <div style={{ fontSize: 11, color: "#A8A29A" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "rgba(168,162,154,0.5)", marginTop: 2 }}>{m.sub}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
          <AllianceReadinessScore
            profileComplete={!!(p.contact_name && p.email)}
            toolbeltCompleted={p.toolbelt_completed ?? false}
            complianceVerified={p.compliance_verified ?? false}
            securityAttested={p.security_attested ?? false}
            routingEligible={p.routing_eligible ?? false}
          />

          <div style={{ padding: "24px", background: "#111111", border: "1px solid rgba(198,166,91,0.16)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 20 }}>Routing Status</div>
            <AllianceComplianceGate
              toolbeltCompleted={p.toolbelt_completed ?? false}
              complianceVerified={p.compliance_verified ?? false}
              securityAttested={p.security_attested ?? false}
              routingEligible={p.routing_eligible ?? false}
              status={p.status}
            />
            {isRoutingEligible && <div style={{ fontSize: 13, color: "#3FA47A" }}>Routing active. You are eligible to receive assigned matters.</div>}
          </div>
        </div>

        <div style={{ padding: "24px", background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.12)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 20 }}>Execution Network Actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { href: "/alliance/jobs", icon: FileStack, label: "Assigned Work", sub: "Governed execution jobs" },
              { href: "/alliance/matters", icon: FileStack, label: "Matter Visibility", sub: "Authorized Matter queue" },
              { href: "/alliance/payouts", icon: Wallet, label: "Payout Status", sub: "View payout history" },
              { href: "/alliance/toolbelt", icon: Link2, label: "Tool Belt", sub: "Readiness and execution resources" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#141414", border: "1px solid rgba(198,166,91,0.1)", borderRadius: 6, textDecoration: "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(198,166,91,0.06)", border: "1px solid rgba(198,166,91,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={14} color="#C6A55A" /></div>
                  <div><div style={{ fontSize: 13, fontWeight: 500, color: "#F6F1E6" }}>{action.label}</div><div style={{ fontSize: 11, color: "#A8A29A" }}>{action.sub}</div></div>
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.12)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(198,166,91,0.08)" }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A" }}>Network Activity</div>
          </div>
          <AllianceActivityLedger entries={[]} />
        </div>

        <p style={{ margin: 0, fontSize: 10, lineHeight: 1.6, color: "rgba(168,162,154,0.46)" }}>
          Milano network designations are internal operating statuses. They do not replace commissions, licenses, governmental credentials, or independent professional duties.
        </p>
      </div>
    </AllianceShell>
  );
}
