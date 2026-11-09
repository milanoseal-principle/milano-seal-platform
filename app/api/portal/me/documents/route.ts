import {createAdminClient} from '@/lib/supabase/admin';
import {versionBytes} from '@/lib/documents/versions';
import {evaluatePaymentGate} from '@/lib/payments/paymentGate';
import {z} from 'zod';
import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { getVaultDocumentsForMatter } from "@/lib/vault";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ctx = await getAllClientDeals();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.deals.length) {
    return NextResponse.json({ files: [] });
  }

  const dealId = req.nextUrl.searchParams.get("deal_id");
  const deal = dealId ? ctx.deals.find((d) => d.id === dealId) : ctx.deals[0];

  if (!deal) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const versionId=req.nextUrl.searchParams.get('version_id');
  if(versionId){
   if(!z.string().uuid().safeParse(versionId).success)return NextResponse.json({error:'INVALID_VERSION_ID'},{status:400});
   const admin=createAdminClient();const row=await admin.from('document_versions').select('id,stage,file_hash,approval_status').eq('id',versionId).eq('matter_id',deal.id).maybeSingle();
   if(row.error||!row.data)return NextResponse.json({error:'VERSION_NOT_FOUND'},{status:404});
   if(row.data.stage!=='intake_upload'){
    const truth=await admin.from('deals').select('id,is_paid_and_released,payment_confirmed,payment_status,payment_settlement_status,amount_due,amount_paid').eq('id',deal.id).single();
    const evidence=await admin.from('custody_ledger').select('id').eq('deal_id',deal.id).eq('event','DOC_RELEASE_CONFIRMED').contains('metadata',{document_versions:[{version_id:versionId,sha256:row.data.file_hash}]}).limit(1);
    if(row.data.stage!=='final_packet'||row.data.approval_status!=='release_ready'||truth.error||!truth.data||truth.data.is_paid_and_released!==true||evaluatePaymentGate(truth.data)!=='PAYMENT_CONFIRMED'||evidence.error||!evidence.data?.length)return NextResponse.json({error:'VERSION_NOT_RELEASED',next_action:'Ask your coordinator to review the final release evidence.'},{status:403});
   }
   try{const {version,bytes}=await versionBytes(admin,deal.id,versionId);return new NextResponse(bytes,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="milano-version-${versionId}.bin"; filename*=UTF-8''${encodeURIComponent(String(version.file_name??'document.bin'))}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch{return NextResponse.json({error:'DOCUMENT_INTEGRITY_REVIEW_REQUIRED',next_action:'Contact your coordinator. The exact stored bytes could not be verified for this download.'},{status:409});}
  }

  // STORAGE-VAULT-01: all document access goes through vault — signed URLs only,
  // storage_path is never returned to the client.
  const documents = await getVaultDocumentsForMatter(deal.id, ctx.email);

  return NextResponse.json({ files: documents });
}
