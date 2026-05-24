import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { roleFromEmail } from "@/lib/rbac";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Auth check
  const supabase = createClient();
  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = roleFromEmail(user.email);
  if (role !== "admin" && role !== "operator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve deal UUID (id may be deal_id slug or UUID)
  const adminClient = createAdminClient();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id,
    );
  const { data: deal, error: dealErr } = await adminClient
    .from("deals")
    .select("id, deal_id, deal_status")
    .eq(isUuid ? "id" : "deal_id", id)
    .single();

  if (dealErr || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const result = await appendLedger({
    deal_id: deal.id,
    event: CUSTODY_EVENTS.DOC_RELEASE_CONFIRMED,
    actor_type: "operator",
    actor_id: user.email ?? user.id,
    notes: "Document release confirmed by operator",
  });

  if (!result) {
    return NextResponse.json(
      { error: "Failed to append custody ledger" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, hash: result.hash });
}
