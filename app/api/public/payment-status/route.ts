import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorOrSelf, isGuardFailure } from "@/lib/auth-guards";

// TODO (SECURITY-05): Replace with a signed short-lived token so clients can
// check their own payment status post-checkout without an authenticated session.
// Until then, this endpoint requires authentication to prevent deal enumeration.
export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("deal_id");
  if (!dealId) {
    return NextResponse.json({ error: "deal_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("deals")
    .select("payment_status, status, email")
    .eq("deal_id", dealId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const guard = await requireOperatorOrSelf(data.email ?? null);
  if (isGuardFailure(guard)) return guard.response;

  return NextResponse.json(
    { payment_status: data.payment_status, status: data.status },
    { headers: { "Cache-Control": "no-store" } },
  );
}
