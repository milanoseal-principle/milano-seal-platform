import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import { AllianceStatusRail } from "@/components/alliance/AllianceStatusRail";
import { AllianceReadinessScore } from "@/components/alliance/AllianceReadinessScore";
import { AllianceComplianceGate } from "@/components/alliance/AllianceComplianceGate";
import { AllianceActivityLedger } from "@/components/alliance/AllianceActivityLedger";
import { AllianceEmptyState } from "@/components/alliance/AllianceEmptyState";
import { FileStack, GitBranch, Link2, Wallet } from "lucide-react";

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

  return (
    <AllianceShell
      partnerName={p.contact_name ?? undefined}
      firmName={p.firm_name ?? undefined}
      routingEligible={isRoutingEligible}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1100 }}>
        {/* Header */}
        <div>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
            Alliance Desk
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 8px" }}>
            {p.firm_name ?? p.contact_name ?? "Welcome"}
          </h1>
          <p style={{ fontSize: 13, color: "#A8A29A", margin: 0 }}>
            Partner infrastructure for international document execution and referral coordination.
          </p>
        </div>

        {/* Lifecycle rail */}
        <div style={{ padding: "20px 24px", background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.12)", borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 16 }}>
            Account Lifecycle
          </div>
          <AllianceStatusRail status={p.status} />
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[
            { icon: GitBranch, label: "Total Referrals", value: referralCount.toString(), sub: "All time" },
            { icon: FileStack, label: "Active Matters", value: "—", sub: "In queue" },
            { icon: Wallet, label: "Outstanding Commission", value: "—", sub: "Pending review" },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                style={{
                  padding: "20px",
                  background: "#0d0d0d",
                  border: "1px solid rgba(198,166,91,0.12)",
                  borderRadius: 8,
                }}
              >
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

        {/* Two-col: Readiness + Routing Gate */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <AllianceReadinessScore
            profileComplete={!!(p.contact_name && p.email)}
            toolbeltCompleted={p.toolbelt_completed ?? false}
            complianceVerified={p.compliance_verified ?? false}
            securityAttested={p.security_attested ?? false}
            routingEligible={p.routing_eligible ?? false}
          />

          <div style={{ padding: "24px", background: "#111111", border: "1px solid rgba(198,166,91,0.16)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 20 }}>
              Routing Status
            </div>
            <AllianceComplianceGate
              toolbeltCompleted={p.toolbelt_completed ?? false}
              complianceVerified={p.compliance_verified ?? false}
              securityAttested={p.security_attested ?? false}
              routingEligible={p.routing_eligible ?? false}
              status={p.status}
            />
            {isRoutingEligible && (
              <div style={{ fontSize: 13, color: "#3FA47A" }}>
                Routing active. You are eligible to receive assigned matters.
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ padding: "24px", background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.12)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 20 }}>
            Quick Actions
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { href: "/alliance/referrals/new", icon: GitBranch, label: "Submit a Referral", sub: "New matter referral" },
              { href: "/alliance/matters", icon: FileStack, label: "View Matters", sub: "Partner matter queue" },
              { href: "/alliance/payouts", icon: Wallet, label: "Commission Status", sub: "View payout history" },
              { href: "/alliance/toolbelt", icon: Link2, label: "Tool Belt", sub: "Partner readiness" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    background: "#141414",
                    border: "1px solid rgba(198,166,91,0.1)",
                    borderRadius: 6,
                    textDecoration: "none",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(198,166,91,0.06)", border: "1px solid rgba(198,166,91,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} color="#C6A55A" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#F6F1E6" }}>{action.label}</div>
                    <div style={{ fontSize: 11, color: "#A8A29A" }}>{action.sub}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Activity ledger */}
        <div style={{ background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.12)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(198,166,91,0.08)" }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A" }}>
              Operational Ledger
            </div>
          </div>
          <AllianceActivityLedger entries={[]} />
        </div>
      </div>
    </AllianceShell>
  );
}
