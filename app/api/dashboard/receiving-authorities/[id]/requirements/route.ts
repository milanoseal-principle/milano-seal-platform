import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import {
  ReceivingRequirementError, loadReceivingRequirements, recordReceivingRequirement, supersedeReceivingRequirement,
} from "@/lib/receiving-authority/requirementsStore";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// The same roles that may edit a receiving-authority record.
const WRITE_ROLES = new Set(["founder_admin", "admin_operator"]);

function failure(error: unknown) {
  if (error instanceof ReceivingRequirementError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  // Anything unexpected is unavailable, never a success.
  return NextResponse.json({ error: "REQUIREMENTS_UNAVAILABLE", message: "Receiving-authority requirements are unavailable right now." }, { status: 503 });
}

// GET — current requirement statements for one receiving authority and whether, for the given
// document category, every requirement is known. ?document_category= narrows the evaluation.
export async function GET(req: NextRequest, { params }: Params) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  const { id } = await params;
  try {
    const category = new URL(req.url).searchParams.get("document_category");
    const result = await loadReceivingRequirements(createAdminClient(), id, category);
    return NextResponse.json({ ...result, canWrite: WRITE_ROLES.has(access.role) });
  } catch (error) {
    return failure(error);
  }
}

// POST — { action: "record", ... } adds a statement; { action: "supersede", ruleId, reason }
// closes one. The verifying operator is always the session user.
export async function POST(req: NextRequest, { params }: Params) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  if (!WRITE_ROLES.has(access.role)) return NextResponse.json({ error: "FORBIDDEN", message: "Your role cannot record receiving-authority requirements." }, { status: 403 });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  try {
    const db = createAdminClient();
    if (body.action === "record") await recordReceivingRequirement(db, id, access.userId, body);
    else if (body.action === "supersede") await supersedeReceivingRequirement(db, id, body.ruleId, access.userId, body.reason);
    else return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
    const category = typeof body.evaluateCategory === "string" ? body.evaluateCategory : null;
    return NextResponse.json({ ...(await loadReceivingRequirements(db, id, category)), canWrite: true });
  } catch (error) {
    return failure(error);
  }
}
