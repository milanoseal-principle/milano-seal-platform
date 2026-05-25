export const dynamic = "force-dynamic";

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Network, Layers, Shield, ArrowRight } from "lucide-react";

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
