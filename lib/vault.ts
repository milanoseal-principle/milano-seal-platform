import {emailsMatch} from '@/lib/auth/clientAccount';
import {evaluatePaymentGate} from '@/lib/payments/paymentGate';
import {readAllKeyset} from '@/lib/data/keyset';
// STORAGE-VAULT-01: Signed document URL generation
// Service-role only. Never called from client. Never returns storage paths.

import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";

export const VAULT_BUCKET = "documents";

// Portal-facing signed URLs expire in 15 minutes.
// Operator-facing (admin download) expire in 1 hour.
export const PORTAL_URL_EXPIRY_SECONDS = 900;
export const OPERATOR_URL_EXPIRY_SECONDS = 3600;

export interface VaultDocument {
  document_id: string;
  matter_id: string;
  document_label: string;
  uploaded_at: string;
  verification_status: "released" | "processing" | "pending";
  signed_url: string | null;
}

/**
 * Fetch all documents for a matter from the client-safe view and return
 * records with short-lived signed URLs. Raw storage_path is never returned.
 */
export async function getVaultDocumentsForMatter(
  matterId: string,
  actorEmail: string,
): Promise<VaultDocument[]> {
  const admin = createAdminClient();

  const owner=await admin.from('deals').select('id,email,is_paid_and_released,payment_confirmed,payment_status,payment_settlement_status,amount_due,amount_paid').eq('id',matterId).maybeSingle();
  if(owner.error||!owner.data||!emailsMatch(owner.data.email,actorEmail))throw Error('VAULT_MATTER_NOT_AUTHORIZED');
  const rows=await readAllKeyset<Record<string,unknown>>(async cursor=>{
   let query=admin.from('client_safe_documents_view').select('document_id,matter_id,document_label,storage_path,uploaded_at,verification_status').eq('matter_id',matterId).order('document_id').limit(100);if(cursor)query=query.gt('document_id',String(cursor.document_id));const result=await query;if(result.error)throw Error('VAULT_READ_UNAVAILABLE');return result.data??[];
  },row=>String(row.document_id));

  const documents = await Promise.all(
    rows.map(async (row) => {
      let signedUrl: string | null = null;

      if (row.storage_path) {
        const { data: signed } = await admin.storage
          .from(VAULT_BUCKET)
          .createSignedUrl(String(row.storage_path), PORTAL_URL_EXPIRY_SECONDS);
        signedUrl = signed?.signedUrl ?? null;
      }

      return {
        document_id: row.document_id as string,
        matter_id: row.matter_id as string,
        document_label: row.document_label as string,
        uploaded_at: row.uploaded_at as string,
        verification_status: row.verification_status as VaultDocument["verification_status"],
        signed_url: signedUrl,
      };
    }),
  );

  const versions=await readAllKeyset<Record<string,unknown>>(async cursor=>{let query=admin.from('document_versions').select('id,stage,file_name,file_hash,storage_path,source_file,metadata,approval_status,created_at').eq('matter_id',matterId).in('stage',['intake_upload','final_packet']).order('id').limit(100);if(cursor)query=query.gt('id',String(cursor.id));const result=await query;if(result.error)throw Error('VAULT_VERSION_READ_UNAVAILABLE');return result.data??[];},row=>String(row.id));
  for(const row of versions){
   const sourceId=(row.metadata as {document_id?:string}|null)?.document_id;
   if(documents.some(document=>document.document_id===row.id||(row.stage==='intake_upload'&&document.document_id===sourceId)))continue;
   if(row.stage==='final_packet'){
    if(owner.data.is_paid_and_released!==true||evaluatePaymentGate(owner.data)!=='PAYMENT_CONFIRMED'||row.approval_status!=='release_ready')continue;
    const evidence=await admin.from('custody_ledger').select('id').eq('deal_id',matterId).eq('event','DOC_RELEASE_CONFIRMED').contains('metadata',{document_versions:[{version_id:row.id,sha256:row.file_hash}]}).limit(1);if(evidence.error||!evidence.data?.length)continue;
   }
   documents.push({document_id:String(row.id),matter_id:matterId,document_label:String(row.file_name??'Document'),uploaded_at:String(row.created_at),verification_status:row.stage==='final_packet'?'released':'pending',signed_url:`/api/portal/me/documents?deal_id=${encodeURIComponent(matterId)}&version_id=${row.id}`});
  }
  await audit({
    event: "portal.document_list.accessed",
    actor: actorEmail,
    resource: `matters:${matterId}`,
    payload: {
      document_count: documents.length,
      url_expiry_seconds: PORTAL_URL_EXPIRY_SECONDS,
    },
  });

  return documents;
}

/**
 * Generate a single short-lived signed URL for a specific document,
 * after verifying the document belongs to the expected matter.
 * Returns null if the file is not found or storage path is missing.
 */
export async function generateVaultSignedUrl(
  documentId: string,
  matterId: string,
  actorEmail: string,
): Promise<{ url: string; expires_in: number } | { error: string; status: 403 | 404 }> {
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("client_safe_documents_view")
    .select("document_id, matter_id, storage_path, document_label")
    .eq("document_id", documentId)
    .maybeSingle();

  if (!row) {
    return { error: "Document not found.", status: 404 };
  }

  if (row.matter_id !== matterId) {
    await audit({
      event: "portal.document.access_denied",
      actor: actorEmail,
      resource: `documents:${documentId}`,
      payload: { reason: "document does not belong to this matter", attempted_matter: matterId },
    });
    return { error: "Access denied: document not linked to this matter.", status: 403 };
  }

  if (!row.storage_path) {
    return { error: "Document is not yet available for download.", status: 403 };
  }

  const { data: signed, error: signErr } = await admin.storage
    .from(VAULT_BUCKET)
    .createSignedUrl(row.storage_path as string, PORTAL_URL_EXPIRY_SECONDS);

  if (signErr || !signed?.signedUrl) {
    return { error: "Failed to generate secure download link.", status: 403 };
  }

  await audit({
    event: "portal.document.downloaded",
    actor: actorEmail,
    resource: `documents:${documentId}`,
    payload: {
      matter_id: matterId,
      document_label: row.document_label,
      expires_in_seconds: PORTAL_URL_EXPIRY_SECONDS,
    },
  });

  return { url: signed.signedUrl, expires_in: PORTAL_URL_EXPIRY_SECONDS };
}
