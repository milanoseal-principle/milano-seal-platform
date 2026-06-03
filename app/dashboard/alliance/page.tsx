export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AllianceScoreboard } from "@/components/dashboard/AllianceScoreboard";
import { CountrySpecialistNetwork } from "@/components/dashboard/CountrySpecialistNetwork";
import { Network, Layers, Shield, ArrowRight, Eye, CheckCheck, Trash2, Users, GitBranch, Inbox, Tag, UserCheck } from "lucide-react";

async function getSummary() {
  const admin = createAdminClient();
  const [profilesRes, assignmentsRes] = await Promise.all([
    admin
      .from("operator_profiles")
      .select("id, admin_approved, onboarding_status", { count: "exact" }),
    admin
      .from("operator_assignments")
      .select("id, assignment_status", { count: "exact" }),
  ]);

  const profiles = profilesRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];

  return {
    totalOperators: profilesRes.count ?? profiles.length,
    pendingApproval: profiles.filter(
      (p) => !p.admin_approved && p.onboarding_status === "compliance_review",
    ).length,
    activeAssignments: assignments.filter((a) =>
      ["offered", "accepted", "in_progress"].includes(a.assignment_status),
    ).length,
    completedAssignments: assignments.filter((a) => a.assignment_status === "completed")
      .length,
  };
}

const MODULES = [
  {
    href: "/dashboard/alliance/trust-graph",
    icon: Network,
    title: "The Global Trust Graph™",
    eyebrow: "Intelligence Backbone",
    description:
      "Verified operator reliability constellation mapped by trust score, execution history, and jurisdiction specialization.",
  },
  {
    href: "/dashboard/alliance/dispatch",
    icon: Layers,
    title: "Alliance Dispatch Queue",
    eyebrow: "Automated Distribution Matrix",
    description:
      "Matter allocation across verified runners, notary specialists, and consular handlers. Full assignment lifecycle visibility.",
  },
  {
    href: "/dashboard/alliance/vault",
    icon: Shield,
    title: "Secure Document Exchange",
    eyebrow: "Zero-Knowledge Custody Channel",
    description:
      "Cryptographically isolated, transient distribution of multi-jurisdictional legal materials to assigned operators only.",
  },
];

export default async function AllianceIntelligencePage() {
  await requireDashboardAccess();
  const summary = await getSummary();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-1">
          Alliance OS™
        </p>
        <h1 className="font-serif text-3xl text-foreground">
          Alliance Intelligence System
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Sovereign execution infrastructure layer — operator trust, dispatch routing,
          jurisdiction intelligence, and secure document coordination.
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Operators", value: summary.totalOperators },
          { label: "Pending Approval", value: summary.pendingApproval },
          { label: "Active Assignments", value: summary.activeAssignments },
          { label: "Completed", value: summary.completedAssignments },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-sm px-4 py-3"
            style={{
              background: "rgba(8,5,1,0.96)",
              border: "1px solid rgba(212,175,55,0.1)",
            }}
          >
            <div
              className="text-2xl font-light"
              style={{
                fontFamily: "var(--font-playfair),Georgia,serif",
                color: "#d4af37",
              }}
            >
              {m.value}
            </div>
            <div
              className="text-[9px] font-mono uppercase tracking-[0.18em] mt-0.5"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {MODULES.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group block rounded-sm transition-colors duration-300"
            style={{
              background: "rgba(8,5,1,0.96)",
              border: "1px solid rgba(212,175,55,0.1)",
            }}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div
                  className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(212,175,55,0.06)",
                    border: "1px solid rgba(212,175,55,0.2)",
                  }}
                >
                  <mod.icon className="w-4 h-4" style={{ color: "#d4af37" }} />
                </div>
                <ArrowRight
                  className="w-4 h-4 mt-1 opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                  style={{ color: "#d4af37" }}
                />
              </div>

              <div>
                <div
                  className="text-[9px] font-mono uppercase tracking-[0.2em] mb-1.5"
                  style={{ color: "rgba(212,175,55,0.5)" }}
                >
                  {mod.eyebrow}
                </div>
                <h3
                  className="text-sm font-light mb-2"
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontFamily: "var(--font-playfair),Georgia,serif",
                  }}
                >
                  {mod.title}
                </h3>
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {mod.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Country Specialist Network */}
      <CountrySpecialistNetwork />

      {/* Alliance Scoreboard */}
      <AllianceScoreboard />
      {/* Alliance Observation Queue */}
      <div
        className="rounded-sm"
        style={{
          background: "rgba(8,5,1,0.96)",
          border: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4" style={{ color: "#d4af37" }} />
            <div>
              <div
                className="text-[9px] font-mono uppercase tracking-[0.25em]"
                style={{ color: "rgba(212,175,55,0.5)" }}
              >
                Operator Review
              </div>
              <h2 className="text-sm font-light" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}>
                Alliance Observation Queue
              </h2>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-3">
          {/* Placeholder observation rows */}
          {[
            {
              partner: "Maria C.",
              role: "Notary",
              corridors: ["Italy", "France"],
              observation: "Rome Municipio II now requires apostille pre-authentication before consular submission. Observed on two matters closed Q1 2026.",
              source_url: "https://example.com/source",
              submitted_at: "2026-05-29T14:22:00Z",
              status: "pending",
            },
            {
              partner: "James R.",
              role: "Attorney",
              corridors: ["Portugal"],
              observation: "Lisbon Cartório de Notas turnaround extended to 14 business days as of May 2026.",
              source_url: "",
              submitted_at: "2026-05-31T09:10:00Z",
              status: "pending",
            },
          ].map((obs, i) => (
            <div
              key={i}
              className="rounded-sm px-4 py-3 space-y-2"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{obs.partner}</span>
                    <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: "rgba(212,175,55,0.4)" }}>{obs.role}</span>
                    {obs.corridors.map((c) => (
                      <span key={c} className="text-[8px] font-mono uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm" style={{ background: "rgba(212,175,55,0.06)", color: "rgba(212,175,55,0.5)", border: "1px solid rgba(212,175,55,0.12)" }}>{c}</span>
                    ))}
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{obs.observation}</p>
                  {obs.source_url && (
                    <a href={obs.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] underline" style={{ color: "rgba(212,175,55,0.4)" }}>Source →</a>
                  )}
                  <div className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Submitted {new Date(obs.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    className="text-[9px] font-mono uppercase tracking-[0.12em] px-2.5 py-1 rounded-sm transition-colors"
                    style={{ background: "rgba(212,175,55,0.08)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.2)" }}
                    title="Mark as reviewed"
                  >
                    <CheckCheck className="w-3 h-3 inline mr-1" />
                    Reviewed
                  </button>
                  <button
                    className="text-[9px] font-mono uppercase tracking-[0.12em] px-2.5 py-1 rounded-sm transition-colors"
                    style={{ background: "rgba(212,175,55,0.04)", color: "rgba(212,175,55,0.6)", border: "1px solid rgba(212,175,55,0.1)" }}
                    title="Promote to Source Vault"
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    Promote
                  </button>
                  <button
                    className="text-[9px] font-mono uppercase tracking-[0.12em] px-2.5 py-1 rounded-sm transition-colors"
                    style={{ background: "rgba(255,60,60,0.04)", color: "rgba(255,100,100,0.5)", border: "1px solid rgba(255,60,60,0.1)" }}
                    title="Discard observation"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    Discard
                  </button>
                </div>
              </div>
            </div>
          ))}
          <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>
            — Observations require operator promotion before influencing Source Vault or authority confidence records. No automatic promotion. —
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            {["ALLIANCE_OBSERVATION_SUBMITTED", "AUTHORITY_OBSERVATION_PENDING_REVIEW"].map((evt) => (
              <span key={evt} className="text-[8px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm" style={{ background: "rgba(212,175,55,0.04)", color: "rgba(212,175,55,0.3)", border: "1px solid rgba(212,175,55,0.08)" }}>{evt}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Referral Source Capture */}
      <div
        className="rounded-sm"
        style={{
          background: "rgba(8,5,1,0.96)",
          border: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4" style={{ color: "#d4af37" }} />
            <div>
              <div
                className="text-[9px] font-mono uppercase tracking-[0.25em]"
                style={{ color: "rgba(212,175,55,0.5)" }}
              >
                Attribution Placeholder
              </div>
              <h2 className="text-sm font-light" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}>
                Referral Source Capture
              </h2>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 overflow-x-auto">
          <table className="w-full text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
                {["Source (UTM / Partner)", "Matter ID", "Status", "Captured At"].map((h) => (
                  <th key={h} className="text-left pb-2 pr-6 text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: "rgba(212,175,55,0.35)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { source: "partner:maria-c", matter_id: "MIL-2026-0041", status: "matter_opened", captured_at: "2026-05-28" },
                { source: "partner:james-r", matter_id: "MIL-2026-0039", status: "intake_only", captured_at: "2026-05-30" },
                { source: "direct:intake", matter_id: "MIL-2026-0044", status: "matter_opened", captured_at: "2026-06-01" },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td className="py-2 pr-6 font-mono text-[10px]" style={{ color: "rgba(212,175,55,0.55)" }}>{row.source}</td>
                  <td className="py-2 pr-6 font-mono">{row.matter_id}</td>
                  <td className="py-2 pr-6">
                    <span className="text-[8px] font-mono uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm" style={{ background: row.status === "matter_opened" ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.04)", color: row.status === "matter_opened" ? "rgba(34,197,94,0.6)" : "rgba(255,255,255,0.3)", border: `1px solid ${row.status === "matter_opened" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)"}` }}>{row.status.replace("_", " ")}</span>
                  </td>
                  <td className="py-2 font-mono text-[10px]">{row.captured_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[9px] font-mono mt-3" style={{ color: "rgba(255,255,255,0.15)" }}>
            Referral attribution captured at intake. No payout logic. Revenue and margin data not exposed here.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            {["REFERRAL_SOURCE_CAPTURED", "PARTNER_LEAD_RECEIVED"].map((evt) => (
              <span key={evt} className="text-[8px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm" style={{ background: "rgba(212,175,55,0.04)", color: "rgba(212,175,55,0.3)", border: "1px solid rgba(212,175,55,0.08)" }}>{evt}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Partner Registry */}
      <div
        className="rounded-sm"
        style={{
          background: "rgba(8,5,1,0.96)",
          border: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" style={{ color: "#d4af37" }} />
            <div>
              <div
                className="text-[9px] font-mono uppercase tracking-[0.25em]"
                style={{ color: "rgba(212,175,55,0.5)" }}
              >
                Registered Partners
              </div>
              <h2 className="text-sm font-light" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}>
                Partner Registry
              </h2>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 overflow-x-auto">
          <table className="w-full text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
                {["Name", "Role", "Corridors", "Joined"].map((h) => (
                  <th key={h} className="text-left pb-2 pr-6 text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: "rgba(212,175,55,0.35)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Maria C.", role: "Notary", corridors: ["Italy", "France"], joined: "2026-04-12" },
                { name: "James R.", role: "Attorney", corridors: ["Portugal"], joined: "2026-05-01" },
                { name: "Elena V.", role: "International Partner", corridors: ["Spain", "Brazil"], joined: "2026-05-20" },
              ].map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td className="py-2 pr-6" style={{ color: "rgba(255,255,255,0.65)" }}>{p.name}</td>
                  <td className="py-2 pr-6 text-[10px] font-mono uppercase tracking-[0.08em]" style={{ color: "rgba(212,175,55,0.45)" }}>{p.role}</td>
                  <td className="py-2 pr-6">
                    <div className="flex flex-wrap gap-1">
                      {p.corridors.map((c) => (
                        <span key={c} className="text-[8px] font-mono uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm" style={{ background: "rgba(212,175,55,0.06)", color: "rgba(212,175,55,0.5)", border: "1px solid rgba(212,175,55,0.12)" }}>{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 font-mono text-[10px]">{p.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[9px] font-mono mt-3" style={{ color: "rgba(255,255,255,0.15)" }}>
            Partner client data, matter internals, revenue, and other partner records are not visible here.
          </p>
        </div>
      </div>

      {/* Positioning statement */}
      <div
        className="rounded-sm px-6 py-5"
        style={{
          background: "rgba(8,5,1,0.96)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div
          className="text-[9px] font-mono uppercase tracking-[0.3em] mb-3"
          style={{ color: "rgba(212,175,55,0.35)" }}
        >
          Alliance Network — Positioning
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            "Not a directory. Not a referral club. Not a freelancer marketplace.",
            "A controlled international execution infrastructure layer designed to coordinate trust, procedural reliability, and cross-border operational intelligence.",
            "The long-term objective: the institutional trust layer between jurisdictions.",
          ].map((line, i) => (
            <p
              key={i}
              className="text-xs leading-relaxed"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
