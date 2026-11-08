import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { POLICY_ADMIN_ROLES, POLICY_TYPES, SURFACE_PATTERN } from "@/lib/policy/acceptance";
import { ronRouteError } from "@/lib/ron/evidenceServer";

export const runtime = "nodejs";

// GET /api/dashboard/policies — full registry history for operators.
export async function GET() {
  try {
    await requireDashboardAccess();
    const { data } = await createAdminClient().from("policy_versions").select("*").order("policy_type").order("created_at").limit(500);
    return NextResponse.json({ ok: true, versions: data ?? [] });
  } catch (error) {
    const failure = ronRouteError(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}

// POST /api/dashboard/policies — create_draft | activate | retire. Content is hashed server-side and
// immutable; activation supersedes the prior active version without rewriting any acceptance.
export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await requireDashboardAccess();
    if (!POLICY_ADMIN_ROLES.has(role)) return NextResponse.json({ ok: false, code: "POLICY_AUTHORITY_REQUIRED" }, { status: 403 });
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const admin = createAdminClient();
    const action = String(body.action ?? "");

    if (action === "create_draft") {
      const policyType = String(body.policy_type ?? "");
      const content = typeof body.content === "string" ? body.content : "";
      const surfaces = Array.isArray(body.required_surfaces) ? body.required_surfaces.map(String) : [];
      const effectiveAt = typeof body.effective_at === "string" ? body.effective_at : "";
      if (!(POLICY_TYPES as readonly string[]).includes(policyType) || !content.trim() || Number.isNaN(Date.parse(effectiveAt))
        || surfaces.some((s) => !SURFACE_PATTERN.test(s)) || typeof body.version !== "string") {
        return NextResponse.json({ ok: false, code: "INVALID_POLICY_DRAFT" }, { status: 422 });
      }
      const sha = createHash("sha256").update(content).digest("hex");
      const path = `policies/${policyType}/${body.version}/${sha}.txt`;
      const { error: uploadError } = await admin.storage.from("documents").upload(path, Buffer.from(content), { contentType: "text/plain", upsert: false });
      if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) return NextResponse.json({ ok: false, code: "POLICY_CONTENT_STORAGE_FAILED" }, { status: 502 });
      const { data: prior } = await admin.from("policy_versions").select("id").eq("policy_type", policyType).eq("status", "active").maybeSingle();
      const { data, error } = await admin.from("policy_versions").insert({
        policy_type: policyType, version: body.version, effective_at: new Date(effectiveAt).toISOString(),
        content_sha256: sha, content_reference: `storage:documents/${path}`, required_surfaces: surfaces,
        supersedes_version_id: prior?.id ?? null, created_by: userId,
      }).select("id").single();
      if (error) return NextResponse.json({ ok: false, code: error.code === "23505" ? "POLICY_VERSION_EXISTS" : "POLICY_DRAFT_REJECTED" }, { status: 409 });
      return NextResponse.json({ ok: true, id: data.id, content_sha256: sha }, { status: 201 });
    }

    const id = String(body.id ?? "");
    const { data: version } = await admin.from("policy_versions").select("id, policy_type, status").eq("id", id).maybeSingle();
    if (!version) return NextResponse.json({ ok: false, code: "POLICY_VERSION_NOT_FOUND" }, { status: 404 });

    if (action === "activate") {
      if (version.status !== "draft") return NextResponse.json({ ok: false, code: "INVALID_POLICY_STATUS_TRANSITION" }, { status: 409 });
      await admin.from("policy_versions").update({ status: "superseded" }).eq("policy_type", version.policy_type).eq("status", "active");
      const { error } = await admin.from("policy_versions").update({ status: "active", activated_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
      if (error) return NextResponse.json({ ok: false, code: "POLICY_ACTIVATION_REJECTED" }, { status: 409 });
      return NextResponse.json({ ok: true, status: "active" });
    }
    if (action === "retire") {
      const { error } = await admin.from("policy_versions").update({ status: "retired" }).eq("id", id).in("status", ["draft", "active"]);
      if (error) return NextResponse.json({ ok: false, code: "INVALID_POLICY_STATUS_TRANSITION" }, { status: 409 });
      return NextResponse.json({ ok: true, status: "retired" });
    }
    return NextResponse.json({ ok: false, code: "INVALID_ACTION" }, { status: 422 });
  } catch (error) {
    const failure = ronRouteError(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}
