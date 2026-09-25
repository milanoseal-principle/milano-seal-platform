import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { PAPER_OUT_ITEMS, readPaperOutChecklist } from "@/lib/intelligence/execution-brain/paperOut";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(["generate", "confirm", "approve"]);
const ITEM_KEYS = new Map<string, boolean>(PAPER_OUT_ITEMS.map((item) => [item.key, item.optional]));

const RPC_ERRORS: Record<string, number> = {
  PAPER_OUT_ALREADY_GENERATED: 409,
  PAPER_OUT_NOT_GENERATED: 409,
  PAPER_OUT_ALREADY_APPROVED: 409,
  PAPER_OUT_INCOMPLETE: 409,
  INVALID_PAPER_OUT_ITEM: 400,
  INVALID_PAPER_OUT_VALUE: 400,
  PAPER_OUT_ITEM_NOT_OPTIONAL: 400,
  EMPTY_PAPER_OUT_ITEMS: 400,
};

async function authorize() {
  const ssr = await createClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) } as const;
  const role = await resolveServerRole(user);
  if (!canPerformProtectedMatterTransition(role)) {
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) } as const;
  }
  return { user } as const;
}

async function loadMatter(id: string) {
  const supabase = createAdminClient();
  const base = supabase.from("deals").select("id, deal_id, updated_at, execution_truth");
  const { data } = UUID_RE.test(id)
    ? await base.or(`id.eq.${id},deal_id.eq.${id}`).maybeSingle()
    : await base.eq("deal_id", id).maybeSingle();
  return { supabase, matter: data };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const { matter } = await loadMatter(id);
  if (!matter) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ checklist: readPaperOutChecklist(matter.execution_truth) });
}

// GENERATE PAPER-OUT CHECKLIST, then record item confirmations and the final
// operator approval. Each step is an atomic execution-truth write with an
// evidence-ledger entry. Florida DOS acceptance is never asserted.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "").trim();
  if (!ACTIONS.has(action)) return NextResponse.json({ error: "INVALID_PAPER_OUT_ACTION" }, { status: 400 });

  const items: Record<string, string> = {};
  if (action === "confirm") {
    const raw = body.items && typeof body.items === "object" && !Array.isArray(body.items) ? body.items : {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      const optional = ITEM_KEYS.get(key);
      if (optional === undefined) return NextResponse.json({ error: "INVALID_PAPER_OUT_ITEM", field: key }, { status: 400 });
      if (value !== "confirmed" && !(value === "not_applicable" && optional)) {
        return NextResponse.json({ error: "INVALID_PAPER_OUT_VALUE", field: key }, { status: 400 });
      }
      items[key] = value;
    }
    if (Object.keys(items).length === 0) return NextResponse.json({ error: "EMPTY_PAPER_OUT_ITEMS" }, { status: 400 });
  }

  const evidenceNote = String(body.evidence_note ?? "").trim();
  if (action !== "generate" && evidenceNote.length < 10) {
    return NextResponse.json(
      { error: "EVIDENCE_NOTE_REQUIRED", message: "Record the evidence basis for this paper-out step." },
      { status: 400 },
    );
  }

  const { supabase, matter } = await loadMatter(id);
  if (!matter) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });

  const { data, error } = await supabase.rpc("record_matter_paper_out", {
    p_matter_id: matter.id,
    p_expected_updated_at: matter.updated_at,
    p_action: action,
    p_items: items,
    p_actor_id: auth.user.id,
    p_occurred_at: new Date().toISOString(),
    p_reason: (evidenceNote || "Paper-out checklist generated.").slice(0, 1000),
  });
  if (error?.code === "40001") {
    return NextResponse.json(
      { error: "STALE_MATTER_STATE", message: "The Matter changed. Refresh and try again." },
      { status: 409 },
    );
  }
  if (error && error.message in RPC_ERRORS) {
    return NextResponse.json({ error: error.message }, { status: RPC_ERRORS[error.message] });
  }
  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result?.matter) {
    return NextResponse.json({ error: "PAPER_OUT_PERSISTENCE_FAILED" }, { status: 500 });
  }
  const updated = result.matter as { execution_truth?: unknown };
  return NextResponse.json({ success: true, checklist: readPaperOutChecklist(updated.execution_truth) });
}
