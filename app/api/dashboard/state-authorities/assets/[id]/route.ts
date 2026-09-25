import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { AUTHORITY_ASSET_FIELDS } from "@/lib/intelligence/execution-brain/stateAuthorityProvenance";

export const runtime = "nodejs";

const WRITE_ROLES = new Set(["founder_admin", "admin_operator"]);

// Operator lifecycle for an official authority asset. Assets are registered
// files, never generated: verification confirms the stored SHA-256 matches the
// file the operator checked against the official source.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, role } = await requireDashboardAccess();
  if (!WRITE_ROLES.has(role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");
  const note = String(body.evidence_note ?? "").trim();
  if (note.length < 10) return NextResponse.json({ error: "EVIDENCE_NOTE_REQUIRED" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: asset } = await supabase.from("authority_source_assets").select(AUTHORITY_ASSET_FIELDS).eq("id", id).maybeSingle();
  if (!asset) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const now = new Date().toISOString();
  let patch: Record<string, unknown>;
  if (action === "verify") {
    if (asset.status !== "ACTIVE") return NextResponse.json({ error: "ASSET_NOT_ACTIVE" }, { status: 409 });
    const sha = String(body.sha256 ?? "").trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(sha) || sha !== asset.sha256) {
      return NextResponse.json(
        { error: "SHA256_MISMATCH", message: "The official file hash does not match the registered asset." },
        { status: 409 },
      );
    }
    patch = { verified_at: now, verified_by: userId, review_notes: note.slice(0, 2000), updated_at: now };
  } else if (action === "supersede") {
    patch = { status: "SUPERSEDED", review_notes: note.slice(0, 2000), updated_at: now };
  } else if (action === "review") {
    patch = { status: "REVIEW_REQUIRED", verified_at: null, verified_by: null, review_notes: note.slice(0, 2000), updated_at: now };
  } else {
    return NextResponse.json({ error: "INVALID_ASSET_ACTION" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("authority_source_assets")
    .update(patch)
    .eq("id", id)
    .select(AUTHORITY_ASSET_FIELDS)
    .single();
  if (error || !data) return NextResponse.json({ error: "ASSET_UPDATE_FAILED" }, { status: 500 });
  return NextResponse.json({ asset: data });
}
