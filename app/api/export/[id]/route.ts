import { readAllKeyset } from '@/lib/data/keyset';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLedger, verifyChain } from "@/lib/custodyLedger";
import { buildSignatureProof } from "@/lib/signatureProof";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireDashboardAccess();
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: deal } = id.match(/^[0-9a-f-]{36}$/i)
    ? await supabase.from("deals").select("*").eq("id", id).single()
    : await supabase.from("deals").select("*").eq("deal_id", id).single();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const [ledger, deal_events, shipping] = await Promise.all([
    getLedger(deal.id),
    ...['deal_events','shipping_analytics'].map(table=>readAllKeyset<Record<string,unknown>>(async cursor=>{
      let query=supabase.from(table).select('*').eq('deal_id',deal.id).order('id').limit(250);if(cursor)query=query.gt('id',String(cursor.id));const result=await query;if(result.error)throw Error('EXPORT_READ_UNAVAILABLE');return result.data??[];
    },row=>String(row.id))),
  ]);

  const verdict = verifyChain(ledger);
  const signature_proof = buildSignatureProof(deal);

  void audit({
    event: "export.json",
    resource: `deal:${deal.id}`,
    payload: { deal_code: deal.deal_id, ledger_entries: ledger.length },
  });

  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";

  const body = JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      deal,
      custody_ledger: ledger,
      chain_integrity: verdict,
      deal_events,
      shipping_analytics: shipping,
      signature_proof,
    },
    null,
    2,
  );

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...(download
        ? {
            "Content-Disposition": `attachment; filename="milano-seal-export-${
              deal.deal_id ?? deal.id
            }.json"`,
          }
        : {}),
      "Cache-Control": "no-store",
    },
  });
}
