export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { TrustGraphConstellation, type TrustNode } from "@/components/alliance/TrustGraphConstellation";

function computeRole(p: {
  ron_capable: boolean | null;
  apostille_runner_capable: boolean | null;
  mobile_capable: boolean | null;
  courier_capable: boolean | null;
}): string {
  if (p.apostille_runner_capable) return "Apostille Runner";
  if (p.ron_capable) return "RON Specialist";
  if (p.mobile_capable) return "Mobile Notary";
  if (p.courier_capable) return "Courier";
  return "Execution Coordinator";
}

function computeScore(opts: {
  identity_verified: boolean | null;
  background_verified: boolean | null;
  admin_approved: boolean | null;
  compliance_ready: boolean;
  toolbelt_pct: number;
}): number {
  let s = 0;
  if (opts.identity_verified) s += 20;
  if (opts.background_verified) s += 20;
  if (opts.admin_approved) s += 20;
  if (opts.compliance_ready) s += 20;
  s += Math.round((opts.toolbelt_pct / 100) * 20);
  return s;
}

function buildCoordinates(count: number): { x: number; y: number }[] {
  if (count === 0) return [];
  if (count === 1) return [{ x: 50, y: 50 }];
  const cols = Math.ceil(Math.sqrt(count * 1.4));
  const rows = Math.ceil(count / cols);
  const xStep = 70 / Math.max(cols - 1, 1);
  const yStep = 58 / Math.max(rows - 1, 1);
  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const offset = row % 2 === 1 ? xStep * 0.5 : 0;
    return {
      x: Math.min(87, 14 + col * xStep + offset),
      y: 16 + row * yStep,
    };
  });
}

async function getTrustNodes(): Promise<TrustNode[]> {
  const admin = createAdminClient();

  const [profilesRes, toolbeltRes, complianceRes, assignmentsRes] =
    await Promise.all([
      admin
        .from("operator_profiles")
        .select(
          "id, full_name, firm_name, identity_verified, background_verified, admin_approved, ron_capable, mobile_capable, apostille_runner_capable, courier_capable",
        )
        .order("created_at", { ascending: false })
        .limit(24),
      admin
        .from("operator_toolbelt_summary")
        .select("operator_id, completion_pct"),
      admin
        .from("operator_compliance_status")
        .select("operator_id, compliance_ready"),
      admin
        .from("operator_assignments")
        .select("operator_id, assignment_status"),
    ]);

  const profiles = profilesRes.data ?? [];
  const toolbeltMap = Object.fromEntries(
    (toolbeltRes.data ?? []).map((t) => [t.operator_id, t.completion_pct ?? 0]),
  );
  const complianceMap = Object.fromEntries(
    (complianceRes.data ?? []).map((c) => [c.operator_id, c.compliance_ready ?? false]),
  );

  const assignmentMap: Record<string, { total: number; completed: number }> = {};
  for (const a of assignmentsRes.data ?? []) {
    if (!assignmentMap[a.operator_id]) {
      assignmentMap[a.operator_id] = { total: 0, completed: 0 };
    }
    assignmentMap[a.operator_id].total++;
    if (a.assignment_status === "completed") {
      assignmentMap[a.operator_id].completed++;
    }
  }

  const coords = buildCoordinates(profiles.length);

  return profiles.map((p, i) => ({
    id: p.id,
    name: p.firm_name ?? p.full_name ?? "Unknown",
    role: computeRole(p),
    score: computeScore({
      identity_verified: p.identity_verified,
      background_verified: p.background_verified,
      admin_approved: p.admin_approved,
      compliance_ready: complianceMap[p.id] ?? false,
      toolbelt_pct: toolbeltMap[p.id] ?? 0,
    }),
    coordinates: coords[i],
    approved: p.admin_approved ?? false,
    verified: (p.identity_verified && p.background_verified) ?? false,
    total_assignments: assignmentMap[p.id]?.total ?? 0,
    completed_assignments: assignmentMap[p.id]?.completed ?? 0,
  }));
}

export default async function TrustGraphPage() {
  const nodes = await getTrustNodes();

  const approvedCount = nodes.filter((n) => n.approved).length;
  const avgScore =
    nodes.length > 0
      ? Math.round(nodes.reduce((s, n) => s + n.score, 0) / nodes.length)
      : 0;
  const highTrust = nodes.filter((n) => n.score >= 80).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-1">
          Alliance Intelligence
        </p>
        <h1 className="font-serif text-3xl text-foreground">
          The Global Trust Graph™
        </h1>
        <p className="text-muted-foreground mt-1 max-w-xl text-sm">
          Verified operator reliability constellation. Trust scores derived
          from identity verification, compliance posture, toolbelt completion,
          and execution history. No phantom data.
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Nodes", value: nodes.length },
          { label: "Approved", value: approvedCount },
          { label: "High Trust (≥80)", value: highTrust },
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
            {m.label === "Total Nodes" && nodes.length > 0 && (
              <div
                className="text-[9px] font-mono mt-1"
                style={{ color: "rgba(212,175,55,0.5)" }}
              >
                AVG SCORE: {avgScore}/100
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Constellation */}
      <TrustGraphConstellation nodes={nodes} />
    </div>
  );
}
