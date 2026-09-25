import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOperatorOrFounder } from "@/lib/security/access-control";
import { summarizeProfessionalAttribution } from "@/lib/professional/attribution";
import { PROFESSIONAL_PROFILE_COLUMNS } from "@/lib/professional/server";

export const runtime = "nodejs";

// Operator view of professional profiles with channel attribution derived from
// canonical Matter/payment truth only.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isOperatorOrFounder(user.app_metadata?.role as string | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const [{ data: profiles, error: profileError }, { data: matters, error: matterError }] = await Promise.all([
    admin.from("professional_profiles").select(PROFESSIONAL_PROFILE_COLUMNS).order("created_at", { ascending: false }),
    admin
      .from("deals")
      .select(
        "id,professional_profile_id,referral_source_type,destination_country,document_type,created_at,completed_at,final_total,discount_amount,amount_paid,verified_revenue,payment_status,quote_review_required,deal_status",
      )
      .not("professional_profile_id", "is", null),
  ]);
  if (profileError || matterError) {
    return NextResponse.json({ error: "Professional channel data unavailable." }, { status: 500 });
  }

  return NextResponse.json({
    profiles,
    attribution: summarizeProfessionalAttribution(matters ?? []),
  });
}
