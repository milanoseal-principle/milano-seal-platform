import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { financialArtifactPdf } from '@/lib/financial/artifact';
import { NextRequest, NextResponse } from "next/server";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildClientInvoiceSnapshot } from "@/lib/portalInvoice";

export const runtime = "nodejs";

const INVOICE_SELECT = [
  "id",
  "deal_id",
  "document_type",
  "destination_country",
  "lane",
  "base_price",
  "docs_count",
  "signers",
  "witness_total",
  "apostille_required",
  "urgency",
  "internal_notes",
  "original_total",
  "eligible_subtotal",
  "non_discountable_total",
  "discount_code",
  "discount_value",
  "discount_amount",
  "final_total",
  "total_price",
  "invoice_subtotal",
  "invoice_retainer",
  "invoice_balance",
  "amount_due",
  "amount_paid",
  "payment_amount_received",
  "payment_status",
  "payment_confirmed",
  "payment_settlement_status",
  "currency",
  "payment_link",
  "payment_reference",
  "wise_reference",
  "matter_pricing_type",
  "quote_execution_method",
  "pricing_version",
  "quote_breakdown",
  "quote_review_required",
  "quote_review_reasons",
].join(",");

export async function GET(req: NextRequest) {
  const requestedId = req.nextUrl.searchParams.get("deal_id");
  const ctx = await getCurrentClientDeal(requestedId);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.deal) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const admin = createAdminClient();
  const artifactId=req.nextUrl.searchParams.get('artifact_id');
  if(artifactId){if(!z.string().uuid().safeParse(artifactId).success)return NextResponse.json({error:'INVALID_ARTIFACT_ID'},{status:400});const result=await admin.from('matter_financial_artifacts').select('*').eq('id',artifactId).eq('matter_id',ctx.deal.id).maybeSingle();if(result.error||!result.data)return NextResponse.json({error:'ARTIFACT_NOT_FOUND'},{status:404});return deliverArtifact(admin,result.data);}
  const { data, error } = await admin
    .from("deals")
    .select(INVOICE_SELECT)
    .eq("id", ctx.deal.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invoice unavailable" }, { status: 500 });
  }

  const invoiceRow = data as unknown as Record<string, unknown>;

  return NextResponse.json({
    success: true,
    invoice: buildClientInvoiceSnapshot(invoiceRow),
  });
}
// Explicit issuance; GET invoice projection remains a non-mutating display.
export async function POST(request:NextRequest) {
 if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site'||!request.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({error:'SAME_ORIGIN_JSON_REQUIRED'},{status:403});
 const input=z.object({matter_id:z.string().uuid(),kind:z.enum(['PRO_FORMA','INVOICE','RECEIPT','PAID_AND_RELEASED'])}).strict().safeParse(await request.json().catch(()=>null));
 if(!input.success)return NextResponse.json({error:'INVALID_ARTIFACT_REQUEST'},{status:400});
 const client=await createClient();const {data:{user}}=await client.auth.getUser();const ctx=await getCurrentClientDeal(input.data.matter_id);
 if(!user||!ctx?.deal)return NextResponse.json({error:'UNAUTHORIZED'},{status:403});
 const admin=createAdminClient();const issued=await admin.rpc('issue_financial_artifact',{p_actor:user.id,p_matter:ctx.deal.id,p_kind:input.data.kind});
 if(issued.error)return NextResponse.json({error:'ARTIFACT_REVIEW_REQUIRED',owner:'MILANO',next_action:'Ask your coordinator to review the approved quote, settlement and release evidence before issuing this artifact.'},{status:409});
 return deliverArtifact(admin,issued.data);
}

async function deliverArtifact(admin:ReturnType<typeof createAdminClient>,raw:unknown) {
 try{const {bytes,sha256,artifact}=await financialArtifactPdf(raw);
  if(!artifact.pdf_sha256){const saved=await admin.from('matter_financial_artifacts').update({pdf_sha256:sha256}).eq('id',artifact.id).is('pdf_sha256',null).select('id');if(saved.error||!saved.data?.length)return NextResponse.json({error:'ARTIFACT_HASH_RECORD_NOT_CONFIRMED',next_action:'Refresh and retry this same artifact.'},{status:409});}
  return new NextResponse(Buffer.from(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="milano-${artifact.kind}-${artifact.id}.pdf"`,'Cache-Control':'private, no-store','X-Artifact-SHA256':sha256}});
 }catch{return NextResponse.json({error:'ARTIFACT_RENDER_OR_INTEGRITY_REVIEW_REQUIRED',owner:'MILANO',next_action:'Ask your coordinator to review character support and immutable artifact integrity.'},{status:409});}
}
