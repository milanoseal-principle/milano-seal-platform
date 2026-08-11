import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function resolvePartner(): Promise<{ partnerId: string } | null> {
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

  const admin = createAdminClient();
  const { data: partner } = await admin
    .from("alliance_partners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!partner) return null;
  return { partnerId: partner.id };
}

// GET /api/alliance/commissions — fetch commissions for current partner (partner-safe fields only)
export async function GET() {
  const session = await resolvePartner();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("partner_commissions")
    // Explicitly select only partner-safe fields — never amount_formula, base_cost, margin
    .select("id, matter_ref, amount, status, period, notes, created_at")
    .eq("partner_id", session.partnerId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load commissions" }, { status: 500 });
  }

  const commissions = (rows ?? []).map((c) => ({
    id: c.id,
    matter_ref: c.matter_ref ?? undefined,
    // Never show amount if NOT_ELIGIBLE
    amount: c.status === "NOT_ELIGIBLE" ? undefined : (c.amount ?? undefined),
    status: c.status as string,
    period: c.period ?? undefined,
    // Only show neutral notes — exclude internal operator notes
    notes: c.notes ?? undefined,
  }));

  // Compute safe summary from approved/paid amounts only
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const approved = commissions.filter(
    (c) => c.status === "APPROVED" || c.status === "PAID"
  );

  const mtd = approved
    .filter((c) => {
      const row = rows?.find((r) => r.id === c.id);
      return row && new Date(row.created_at) >= monthStart;
    })
    .reduce((sum, c) => sum + (c.amount ?? 0), 0);

  const ytd = approved
    .filter((c) => {
      const row = rows?.find((r) => r.id === c.id);
      return row && new Date(row.created_at) >= yearStart;
    })
    .reduce((sum, c) => sum + (c.amount ?? 0), 0);

  const outstanding = commissions
    .filter((c) => c.status === "APPROVED")
    .reduce((sum, c) => sum + (c.amount ?? 0), 0);

  return NextResponse.json({
    commissions,
    summary: {
      month_to_date: mtd || undefined,
      year_to_date: ytd || undefined,
      outstanding: outstanding || undefined,
    },
  });
}
