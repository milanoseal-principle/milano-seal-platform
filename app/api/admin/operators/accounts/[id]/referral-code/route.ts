import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid, requireBindingAdmin, rotateReferralCode } from "@/lib/alliance/accountBinding";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// POST — issue a new referral code for a bound account (reason required). Existing attribution
// is kept: it references the account, not the code.
export async function POST(req: NextRequest, { params }: Params) {
  const access = await requireBindingAdmin();
  if (!access.ok) return access.response;
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { reason?: unknown } | null;
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!isUuid(id)) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  if (!reason) return NextResponse.json({ error: "REASON_REQUIRED", message: "A reason is required for this change." }, { status: 400 });
  const result = await rotateReferralCode(createAdminClient(), { operatorId: id, actorId: access.userId, reason });
  if (!result.ok) return NextResponse.json({ error: result.code, message: result.message }, { status: result.status });
  return NextResponse.json(result);
}
