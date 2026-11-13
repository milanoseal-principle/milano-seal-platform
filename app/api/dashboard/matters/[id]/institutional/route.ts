import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import {
  InstitutionalLedgerError, decideInstitutionalRoute, loadInstitutionalState, recordInstitutionalEvidence, recordInstitutionalReview,
} from "@/lib/institutional/evidenceLedger";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function failure(error: unknown) {
  if (error instanceof InstitutionalLedgerError) return NextResponse.json({ error: error.code, message: error.message, details: error.details ?? null }, { status: error.status });
  // Anything unexpected is unavailable, never a success.
  return NextResponse.json({ error: "INSTITUTIONAL_LEDGER_UNAVAILABLE", message: "Institutional evidence is unavailable right now." }, { status: 503 });
}

// GET — the Matter's institutional review: what is under review, evidence with its version history,
// decisions, the derived route decision, and the Matter's own document versions for attachment.
export async function GET(_req: NextRequest, { params }: Params) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  const { id } = await params;
  try {
    const db = createAdminClient();
    const state = await loadInstitutionalState(db, id);
    const { data: versions, error } = await db.from("document_versions").select("id, file_name, version_number, stage, file_hash, created_at").eq("matter_id", id).order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return NextResponse.json({ state, documentVersions: versions ?? [], canDecide: canPerformProtectedMatterTransition(access.role) });
  } catch (error) {
    return failure(error);
  }
}

// POST — { action: "review" | "evidence" | "approve" | "reject", ... }. The actor is always the
// verified session user. Approving or rejecting needs the protected-transition authority.
export async function POST(req: NextRequest, { params }: Params) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  try {
    const db = createAdminClient();
    if (body.action === "review") await recordInstitutionalReview(db, id, access.userId, body);
    else if (body.action === "evidence") await recordInstitutionalEvidence(db, id, access.userId, body);
    else if (body.action === "approve" || body.action === "reject") {
      if (!canPerformProtectedMatterTransition(access.role)) return NextResponse.json({ error: "FORBIDDEN", message: "Your role can record evidence but cannot approve or reject a pathway." }, { status: 403 });
      await decideInstitutionalRoute(db, id, access.userId, body.action, body.reason);
    } else return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
    return NextResponse.json({ state: await loadInstitutionalState(db, id) });
  } catch (error) {
    return failure(error);
  }
}
