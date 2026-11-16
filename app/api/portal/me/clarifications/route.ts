// Client portal: the questions Milano still needs answered for this Matter, and
// a way to answer them. Answers are stored as unverified client declarations in
// the evidence ledger; they never change execution truth, pricing, payment or
// scheduling. Ownership is enforced by getCurrentClientDeal (exact email match).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  CLIENT_DECLARATION_EVENT,
  CLIENT_DECLARATION_SOURCE,
  validateDeclarationSubmission,
} from "@/lib/matter/matterResolution";
import {
  loadMatterResolution,
  RESOLUTION_MATTER_SELECT,
  type ResolutionMatterRow,
} from "@/lib/matter/matterResolutionServer";

export const runtime = "nodejs";

async function ownedMatter(dealId: string | null) {
  const ctx = await getCurrentClientDeal(dealId);
  if (!ctx) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!ctx.deal) return { error: NextResponse.json({ error: "Matter not found" }, { status: 404 }) };
  const admin = createAdminClient();
  const { data, error } = await admin.from("deals").select(RESOLUTION_MATTER_SELECT).eq("id", ctx.deal.id).maybeSingle();
  if (error) return { error: NextResponse.json({ error: "MATTER_UNAVAILABLE" }, { status: 503 }) };
  if (!data) return { error: NextResponse.json({ error: "Matter not found" }, { status: 404 }) };
  return { admin, matter: data as ResolutionMatterRow };
}

// Client-safe projection: status, outstanding questions and which facts were answered.
// Internal validator codes are not exposed.
function clientView(result: Awaited<ReturnType<typeof loadMatterResolution>>) {
  return {
    status: result.resolution.status,
    questions: result.resolution.questions,
    answered: result.resolution.answered,
  };
}

export async function GET(req: NextRequest) {
  const owned = await ownedMatter(req.nextUrl.searchParams.get("deal_id"));
  if ("error" in owned) return owned.error;
  try {
    return NextResponse.json(clientView(await loadMatterResolution(owned.admin, owned.matter)), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "CLARIFICATIONS_UNAVAILABLE" }, { status: 503 });
  }
}

const bodySchema = z.object({ deal_id: z.string().uuid(), answers: z.record(z.string(), z.unknown()) });

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  const owned = await ownedMatter(parsed.data.deal_id);
  if ("error" in owned) return owned.error;
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const current = await loadMatterResolution(owned.admin, owned.matter);
    if (current.resolution.status === "closed") {
      return NextResponse.json({ error: "CLARIFICATIONS_CLOSED" }, { status: 409 });
    }
    const checked = validateDeclarationSubmission(current.resolution.questions, parsed.data.answers);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

    const { error } = await owned.admin.from("matter_evidence_ledger").insert({
      matter_id: owned.matter.id,
      event_type: CLIENT_DECLARATION_EVENT,
      domain: "execution",
      actor_type: "client",
      actor_id: user.id,
      source: CLIENT_DECLARATION_SOURCE,
      new_value: { declarations: checked.declarations, verified: false },
      reason: "Client portal clarification. Unverified client declaration; operator confirms through execution review.",
    });
    if (error) return NextResponse.json({ error: "CLARIFICATION_NOT_SAVED" }, { status: 503 });

    // Revalidate immediately so the client sees what (if anything) is still needed.
    return NextResponse.json({ ok: true, ...clientView(await loadMatterResolution(owned.admin, owned.matter)) });
  } catch {
    return NextResponse.json({ error: "CLARIFICATIONS_UNAVAILABLE" }, { status: 503 });
  }
}
