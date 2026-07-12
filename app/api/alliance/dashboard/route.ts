import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toPartnerStatus, toPartnerCommissionStatus } from "@/lib/alliance/partnerProjection";

// ─── Auth ────────────────────────────────────────────────────────────────────
async function resolvePartnerSession(): Promise<{ userId: string; email: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role =
    (user.app_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined) ??
    "";

  const allowed = ["founder_admin", "alliance", "alliance_partner", "alliance_member"];
  if (!allowed.includes(role)) return null;

  return { userId: user.id, email: user.email ?? "" };
}

// ─── GET /api/alliance/dashboard ─────────────────────────────────────────────
export async function GET() {
  const session = await resolvePartnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { userId } = session;

  // 1. Look up the alliance_partner record for this user (operator_profiles.id = auth.uid)
  //    The partner_id used in partner_observations and partner_commissions is the
  //    alliance_partners.id (UUID), but the auth user is linked via operator_profiles.
  //    We resolve via email match as fallback when no direct FK exists yet.
  const { data: opProfile } = await admin
    .from("operator_profiles")
    .select("id, full_name, firm_name")
    .eq("id", userId)
    .single();

  // Attempt to find alliance_partner record by matching auth user id or email
  let alliancePartnerId: string | null = null;

  // Try direct ID match first (if alliance_partners.id == auth uid)
  const { data: apById } = await admin
    .from("alliance_partners")
    .select("id")
    .eq("id", userId)
    .single();

  if (apById) {
    alliancePartnerId = apById.id;
  } else if (session.email) {
    // Fallback: match by email
    const { data: apByEmail } = await admin
      .from("alliance_partners")
      .select("id")
      .eq("email", session.email)
      .single();
    if (apByEmail) alliancePartnerId = apByEmail.id;
  }

  // 2. Fetch referred matters (partner_observations) — partner-safe columns only
  const observationsQuery = admin
    .from("partner_observations")
    .select("id, country, document_type, status, observation_type, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (alliancePartnerId) {
    observationsQuery.eq("partner_id", alliancePartnerId);
  } else {
    // No partner record found — return empty state, not an error
    return NextResponse.json({
      no_data: true,
      referred_matters: [],
      stats: {
        active_matters: 0,
        this_month: 0,
        total_referred: 0,
        outstanding_commission: null,
      },
      commissions: [],
    });
  }

  const { data: observations } = await observationsQuery;

  // 3. Fetch commission records for this partner (partner_commissions)
  //    Only partner-safe fields: id, matter_id, commission_status, payout_due_at, payout_paid_at
  //    NEVER return: payout_amount, commission_rate, payout_reference, partner_name
  const { data: commissions } = await admin
    .from("partner_commissions")
    .select("id, matter_id, commission_status, payout_due_at, payout_paid_at, created_at")
    .eq("partner_id", alliancePartnerId)
    .order("created_at", { ascending: false })
    .limit(100);

  // 4. Map observations to partner-safe referred matter rows
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const referredMatters = (observations ?? []).map((obs) => ({
    matter_id: `REF-${obs.id.substring(0, 8).toUpperCase()}`,
    destination_country: obs.country ?? "—",
    document_type: obs.document_type ?? "—",
    status: toPartnerStatus(obs.status ?? "pending_review"),
    submitted_at: obs.created_at,
  }));

  // 5. Compute stats from partner-safe data only
  const activeStatuses = new Set(["In Progress", "In Review", "Awaiting Client Action", "Awaiting Authentication", "In Transit"]);
  const activeMatterCount = referredMatters.filter((m) => activeStatuses.has(m.status)).length;
  const thisMonthCount = referredMatters.filter(
    (m) => new Date(m.submitted_at) >= thisMonthStart,
  ).length;

  // 6. Map commissions to partner-safe ledger rows
  const commissionRows = (commissions ?? []).map((c) => ({
    id: c.id,
    matter_id: c.matter_id,
    commission_status: toPartnerCommissionStatus(c.commission_status ?? "pending"),
    payout_due_at: c.payout_due_at ?? null,
    payout_paid_at: c.payout_paid_at ?? null,
    created_at: c.created_at,
  }));

  return NextResponse.json({
    no_data: referredMatters.length === 0,
    referred_matters: referredMatters,
    stats: {
      active_matters: activeMatterCount,
      this_month: thisMonthCount,
      total_referred: referredMatters.length,
      // outstanding_commission is intentionally null — amount is never exposed
      outstanding_commission: null,
    },
    commissions: commissionRows,
  });
}
