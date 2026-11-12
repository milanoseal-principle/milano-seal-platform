import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAlliancePartner } from "@/lib/alliance/partnerContext";

// Commission tracking is not configured: no commission policy or commission ledger exists in the
// canonical schema (partner_commissions never existed on the hosted database). Commissions are
// never computed or invented here; attributed referrals live in referral_ledger and the referral
// views. This endpoint says so explicitly instead of returning an empty ledger.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let partner;
  try {
    partner = await resolveAlliancePartner(user?.id);
  } catch {
    return NextResponse.json({ error: "Commission data is unavailable right now." }, { status: 503 });
  }
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(
    {
      error: "Commission tracking is not yet configured for Alliance partners. Your attributed referrals are listed under Referrals.",
      code: "COMMISSION_POLICY_NOT_CONFIGURED",
    },
    { status: 501 },
  );
}
