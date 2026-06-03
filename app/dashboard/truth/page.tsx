export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
// RECEIVING_AUTHORITIES — loaded at runtime; gracefully empty if not available in this worktree
interface AuthorityRecord {
  valid_to: string | null;
  authority_confidence: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RECEIVING_AUTHORITIES: AuthorityRecord[] = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RECEIVING_AUTHORITIES = require("@/data/authorities").RECEIVING_AUTHORITIES ?? [];
} catch {
  RECEIVING_AUTHORITIES = [];
}
import { SystemHealth } from "@/components/dashboard/SystemHealth";
import { CourierHealthCard } from "@/components/dashboard/CourierHealthCard";

export const metadata = {
  title: "System Truth Engine — Milano Seal",
};

export interface HealthScore {
  category: string;
  score: number;
  label: "STRONG" | "GOOD" | "DEVELOPING" | "EARLY" | "CRITICAL";
  note: string;
  route: string;
}

function scoreLabel(score: number): HealthScore["label"] {
  if (score >= 80) return "STRONG";
  if (score >= 60) return "GOOD";
  if (score >= 40) return "DEVELOPING";
  if (score >= 20) return "EARLY";
  return "CRITICAL";
}

export default async function TruthPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  const [dealsRes, followUpsRes] = await Promise.all([
    supabase
      .from("deals")
      .select(
        "id, payment_status, matter_status, updated_at, total_price, apostille_at, completed_at, created_at, conversion_score, apostille_required, destination_country, document_type, referral_source"
      )
      .limit(500),
    supabase
      .from("follow_ups")
      .select("id, status, due_at")
      .limit(200),
  ]);

  const deals = dealsRes.data ?? [];
  // followUps available for future use
  void followUpsRes;

  const scores: HealthScore[] = [];

  // 1. Revenue Health
  try {
    const paid = deals.filter((d) => d.payment_status === "paid");
    const unpaid = deals.filter(
      (d) => d.payment_status === "unpaid" && d.matter_status !== "cancelled"
    );
    const total = paid.length + unpaid.length;
    let revenueScore = 100;
    if (total > 0) {
      const paidRatio = paid.length / total;
      const avgConversion =
        unpaid.length > 0
          ? unpaid.reduce((sum, d) => sum + (d.conversion_score ?? 0), 0) /
            unpaid.length
          : 0;
      revenueScore = Math.round(paidRatio * 60 + (avgConversion / 100) * 40);
    }
    scores.push({
      category: "Revenue Health",
      score: revenueScore,
      label: scoreLabel(revenueScore),
      note: `${paid.length} paid matters. Pipeline conversion avg ${
        unpaid.length > 0
          ? Math.round(
              unpaid.reduce((s, d) => s + (d.conversion_score ?? 0), 0) /
                unpaid.length
            )
          : 0
      }%.`,
      route: "/dashboard/financials",
    });
  } catch {
    scores.push({
      category: "Revenue Health",
      score: 0,
      label: "CRITICAL",
      note: "Score calculation failed.",
      route: "/dashboard/financials",
    });
  }

  // 2. Execution Health
  try {
    const activePaid = deals.filter(
      (d) =>
        d.payment_status === "paid" &&
        !["completed", "released", "cancelled"].includes(d.matter_status ?? "")
    );
    let executionScore = 100;
    if (activePaid.length > 0) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const stale = activePaid.filter(
        (d) => d.updated_at && new Date(d.updated_at) < sevenDaysAgo
      );
      const needsApostille = activePaid.filter((d) => d.apostille_required);
      const apostilleDone = needsApostille.filter((d) => d.apostille_at);
      const staleRatio = stale.length / activePaid.length;
      const apostilleRatio =
        needsApostille.length === 0
          ? 1
          : apostilleDone.length / needsApostille.length;
      executionScore = Math.round(
        (1 - staleRatio) * 60 + apostilleRatio * 40
      );
    }
    scores.push({
      category: "Execution Health",
      score: executionScore,
      label: scoreLabel(executionScore),
      note: `${activePaid.length} active paid matters in execution.`,
      route: "/dashboard/execution-control",
    });
  } catch {
    scores.push({
      category: "Execution Health",
      score: 0,
      label: "CRITICAL",
      note: "Score calculation failed.",
      route: "/dashboard/execution-control",
    });
  }

  // 3. Authority Health
  try {
    const active = RECEIVING_AUTHORITIES.filter((a) => a.valid_to === null);
    const verified = active.filter((a) =>
      [
        "AUTHORITY_VERIFIED",
        "MULTI_SOURCE_CONFIRMED",
        "PARTNER_CONFIRMED",
      ].includes(a.authority_confidence)
    );
    const authorityScore =
      active.length === 0
        ? 0
        : Math.round((verified.length / active.length) * 100);
    scores.push({
      category: "Authority Health",
      score: authorityScore,
      label: scoreLabel(authorityScore),
      note: `${verified.length} of ${active.length} active authorities verified.`,
      route: "/dashboard/authorities",
    });
  } catch {
    scores.push({
      category: "Authority Health",
      score: 0,
      label: "CRITICAL",
      note: "Score calculation failed.",
      route: "/dashboard/authorities",
    });
  }

  // 4. Trust Health
  try {
    const completed = deals.filter((d) =>
      ["completed", "released"].includes(d.matter_status ?? "")
    );
    const totalPaid = deals.filter((d) => d.payment_status === "paid");
    const trustScore =
      totalPaid.length === 0
        ? 0
        : Math.min(
            100,
            Math.round((completed.length / totalPaid.length) * 100)
          );
    scores.push({
      category: "Trust Health",
      score: trustScore,
      label: scoreLabel(trustScore),
      note: `${completed.length} completed of ${totalPaid.length} paid matters.`,
      route: "/dashboard/trust",
    });
  } catch {
    scores.push({
      category: "Trust Health",
      score: 0,
      label: "CRITICAL",
      note: "Score calculation failed.",
      route: "/dashboard/trust",
    });
  }

  // 5. Partner Health
  try {
    const withReferral = deals.filter(
      (d) => d.referral_source && d.referral_source !== ""
    );
    const uniqueSources = new Set(withReferral.map((d) => d.referral_source))
      .size;
    const partnerScore = Math.min(100, uniqueSources * 10);
    scores.push({
      category: "Partner Health",
      score: partnerScore,
      label: scoreLabel(partnerScore),
      note: `${uniqueSources} unique referral sources tracked.`,
      route: "/dashboard/referral",
    });
  } catch {
    scores.push({
      category: "Partner Health",
      score: 0,
      label: "CRITICAL",
      note: "Score calculation failed.",
      route: "/dashboard/referral",
    });
  }

  // 6. Deployment Health — operator-confirmed
  scores.push({
    category: "Deployment Health",
    score: 0,
    label: "CRITICAL",
    note: "Pending operator verification — see /dashboard/deployment",
    route: "/dashboard/deployment",
  });

  // 7. Corridor Health
  try {
    const completedCorridors = new Set(
      deals
        .filter((d) =>
          ["completed", "released"].includes(d.matter_status ?? "")
        )
        .map((d) => `${d.destination_country}::${d.document_type}`)
    ).size;
    const corridorScore = Math.min(100, completedCorridors * 5);
    scores.push({
      category: "Corridor Health",
      score: corridorScore,
      label: scoreLabel(corridorScore),
      note: `${completedCorridors} unique completed corridors.`,
      route: "/dashboard/corridors",
    });
  } catch {
    scores.push({
      category: "Corridor Health",
      score: 0,
      label: "CRITICAL",
      note: "Score calculation failed.",
      route: "/dashboard/corridors",
    });
  }

  const overallScore = Math.round(
    scores.reduce((sum, s) => sum + s.score, 0) / scores.length
  );

  return (
    <>
      <SystemHealth scores={scores} overallScore={overallScore} />
      <CourierHealthCard />
    </>
  );
}
