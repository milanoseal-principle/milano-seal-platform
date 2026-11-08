import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { acceptanceMismatch, SHA256_PATTERN, SURFACE_PATTERN, type PolicyVersionRow } from "@/lib/policy/acceptance";

export const runtime = "nodejs";

// POST /api/portal/me/policy-acceptance — the signed-in client accepts the exact policy version shown,
// for their own Matter only. A client checkbox alone is never authority; this server record is.
export async function POST(req: NextRequest) {
  const server = await createClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user?.id || !user.email) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const dealId = typeof body.deal_id === "string" ? body.deal_id : null;
  const versionId = typeof body.policy_version_id === "string" ? body.policy_version_id : "";
  const surface = typeof body.surface === "string" ? body.surface : "";
  const shownSha = typeof body.content_sha256 === "string" ? body.content_sha256 : "";
  if (!dealId || !versionId || !SURFACE_PATTERN.test(surface) || !SHA256_PATTERN.test(shownSha)) {
    return NextResponse.json({ ok: false, code: "INVALID_ACCEPTANCE" }, { status: 422 });
  }

  const ctx = await getCurrentClientDeal(dealId);
  if (!ctx?.deal || ctx.deal.id !== dealId) return NextResponse.json({ ok: false, code: "MATTER_NOT_FOUND" }, { status: 404 });

  const admin = createAdminClient();
  const { data: version } = await admin
    .from("policy_versions")
    .select("id, policy_type, version, content_sha256, effective_at, status, required_surfaces")
    .eq("id", versionId)
    .maybeSingle();
  const mismatch = acceptanceMismatch((version as PolicyVersionRow | null) ?? null, shownSha);
  if (mismatch || !version) return NextResponse.json({ ok: false, code: mismatch }, { status: 409 });

  const idempotencyKey = `${dealId}:${version.id}:${user.id}`;
  const { error } = await admin.from("policy_acceptances").insert({
    policy_version_id: version.id,
    policy_type: version.policy_type,
    version: version.version,
    content_sha256: version.content_sha256,
    effective_at: version.effective_at,
    actor_user_id: user.id,
    actor_email: user.email,
    matter_id: dealId,
    surface,
    required: (version.required_surfaces as string[]).includes(surface),
    request_metadata: { user_agent_present: Boolean(req.headers.get("user-agent")) },
    idempotency_key: idempotencyKey,
  });
  if (error?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
  if (error) return NextResponse.json({ ok: false, code: "POLICY_ACCEPTANCE_REJECTED" }, { status: 409 });
  return NextResponse.json({ ok: true, policy_type: version.policy_type, version: version.version }, { status: 201 });
}
