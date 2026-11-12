import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bindOperatorProfile, isUuid, requireBindingAdmin } from "@/lib/alliance/accountBinding";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// POST — bind this Alliance account to an operator profile, or unbind it ({ profile_id: null },
// reason required). The acting administrator is the verified session user.
export async function POST(req: NextRequest, { params }: Params) {
  const access = await requireBindingAdmin();
  if (!access.ok) return access.response;
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { profile_id?: unknown; reason?: unknown } | null;
  if (!isUuid(id) || !body || !("profile_id" in body) || (body.profile_id !== null && !isUuid(body.profile_id))) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null;
  const result = await bindOperatorProfile(createAdminClient(), { operatorId: id, profileId: body.profile_id as string | null, actorId: access.userId, reason });
  if (!result.ok) return NextResponse.json({ error: result.code, message: result.message }, { status: result.status });
  return NextResponse.json(result);
}
