import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BNSignedDocumentResult } from './types';
import { sanitizeDocumentName } from './documents';

export async function storeImmutableRONPDF(admin: SupabaseClient, path: string, bytes: Buffer) {
  if (!bytes.length || bytes.subarray(0,5).toString() !== '%PDF-') throw new Error('Document is not a PDF');
  const digest=createHash('sha256').update(bytes).digest('hex');
  const {error}=await admin.storage.from('documents').upload(path,bytes,{contentType:'application/pdf',upsert:false});
  if(error){
    const existing=await admin.storage.from('documents').download(path);
    if(existing.error || !existing.data || createHash('sha256').update(Buffer.from(await existing.data.arrayBuffer())).digest('hex')!==digest) throw new Error('Immutable document storage could not be verified');
  }
  return digest;
}

export async function storeRONExecutedDocuments(admin: SupabaseClient, session: { id: string; matter_id: string }, documents: BNSignedDocumentResult[]) {
  if (!documents.length) throw new Error('No executed documents are available');
  const ids: string[] = [];
  for (const document of documents) {
    try {
      const bytes = Buffer.from(document.base64_content, 'base64');
      if (!bytes.length || bytes.subarray(0,5).toString() !== '%PDF-') throw new Error('Executed document is not a PDF');
      const digest = createHash('sha256').update(bytes).digest('hex');
      const name = sanitizeDocumentName(document.document_name || 'executed.pdf') || 'executed.pdf';
      const path = `ron/${session.matter_id}/${session.id}/executed/${digest}/${name}`;
      await storeImmutableRONPDF(admin,path,bytes);
      // Bind provider output to the exact source document previously submitted.
      const sources = await admin.from('ron_documents').select('id,document_name,blue_notary_document_name,storage_bucket,storage_path,submitted_storage_path').eq('ron_session_id',session.id).eq('matter_id',session.matter_id).eq('uploaded_to_bluenotary',true).is('signed_sha256',null);
      if (sources.error) throw new Error('Source document lookup failed');
      const matches = sources.data?.filter(source=>source.blue_notary_document_name === document.document_name || source.document_name === document.document_name) ?? [];
      if (matches.length !== 1 || !matches[0].submitted_storage_path) throw new Error('Source document mapping requires operator review');
      const source=matches[0];
      const original = await admin.storage.from('documents').download(source.submitted_storage_path);
      if (original.error || !original.data) throw new Error('Source document bytes could not be verified');
      const sourceHash=createHash('sha256').update(Buffer.from(await original.data.arrayBuffer())).digest('hex');
      const captured=await admin.rpc('capture_ron_executed_document', {p_session_id:session.id,p_source_id:source.id,p_source_sha256:sourceHash,p_sha256:digest,p_name:name,p_storage_path:path});
      if(captured.error || typeof captured.data !== 'string') throw new Error('Executed document lineage and custody could not be recorded');
      ids.push(captured.data);
    } finally { document.base64_content = ''; }
  }
  return ids;
}
