import { NextResponse } from "next/server";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getCurrentClientDeal();

  if (!ctx || !ctx.deal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("custody_ledger")
    .select("id, deal_id, event, actor_type, notes, created_at")
    .eq("deal_id", ctx.deal.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
  }

  // Return only the safe subset — never actor_id, internal_notes, label_url,
  // storage_path, shipping_cost, margin, or metadata internals.
  const events = (data ?? []).map((row) => ({
    id: row.id,
    deal_id: row.deal_id,
    event: row.event,
    actor_type: row.actor_type,
    notes: row.notes ?? null,
    created_at: row.created_at,
  }));

  return NextResponse.json({ events });
}
