import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SURFACE_PATTERN } from "@/lib/policy/acceptance";

export const runtime = "nodejs";

// GET /api/policy/active?surface=… — published policy metadata only (no private pricing, no PII).
export async function GET(request: NextRequest) {
  const surface = request.nextUrl.searchParams.get("surface") ?? "";
  if (surface && !SURFACE_PATTERN.test(surface)) return NextResponse.json({ ok: false, code: "INVALID_SURFACE" }, { status: 422 });
  const admin = createAdminClient();
  let query = admin
    .from("policy_versions")
    .select("id, policy_type, version, effective_at, content_sha256, content_reference, required_surfaces")
    .eq("status", "active")
    .lte("effective_at", new Date().toISOString())
    .order("policy_type");
  if (surface) query = query.contains("required_surfaces", [surface]);
  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, code: "POLICY_REGISTRY_UNAVAILABLE" }, { status: 503 });
  return NextResponse.json({ ok: true, policies: data ?? [] });
}
