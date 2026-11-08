import { getLedger } from '@/lib/custodyLedger';
import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matterId: string }> }
) {
  await requireDashboardAccess();
  const { matterId } = await params;
  let rows;try{rows=await getLedger(matterId);}catch{return NextResponse.json({error:'CUSTODY_READ_UNAVAILABLE',owner:'MILANO'},{status:503});}

  // Never expose: actor_id, label_url, storage_path
  const events = (rows ?? []).map((e) => ({
    id: e.id,
    deal_id: e.deal_id,
    event: e.event,
    actor_type: e.actor_type ?? "system",
    notes: e.notes ? String(e.notes).slice(0, 80) : null,
    created_at: e.created_at,
    stage_from: e.metadata?.stage_from ?? null,
    stage_to: e.metadata?.stage_to ?? null,
  }));

  return NextResponse.json({ events });
}
