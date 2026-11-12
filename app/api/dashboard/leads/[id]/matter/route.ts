import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { z } from "zod";
import { recordPartnerReferralAttribution } from "@/lib/alliance/referralLeads";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!canPerformProtectedMatterTransition(await resolveServerRole(user))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "INVALID_LEAD_ID" }, { status: 400 });
  const { data, error } = await createAdminClient().rpc("convert_sales_lead_to_matter", { p_lead_id: id, p_actor_id: user.id });
  if (error) return NextResponse.json({ error: error.code === "P0002" ? "LEAD_NOT_FOUND" : "LEAD_CONVERSION_FAILED", retryable: error.code !== "22023" }, { status: error.code === "P0002" ? 404 : error.code === "42501" ? 403 : error.code === "22023" ? 409 : 503 });
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.matter_id) return NextResponse.json({ error: "LEAD_CONVERSION_UNCONFIRMED", retryable: true }, { status: 503 });
  // A partner referral lead keeps its partner attribution on the new Matter.
  try {
    await recordPartnerReferralAttribution(createAdminClient(), id, result.matter_id);
  } catch {
    return NextResponse.json({ ok: true, matter_id: result.matter_id, duplicate: result.duplicate, attribution: "NOT_RECORDED_RETRY" }, { status: 202 });
  }
  return NextResponse.json({ ok: true, matter_id: result.matter_id, duplicate: result.duplicate });
}
