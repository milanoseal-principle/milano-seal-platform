import { createHash } from 'node:crypto';
import type { createAdminClient } from '@/lib/supabase/admin';
import { appendLedger, CUSTODY_EVENTS } from '@/lib/custodyLedger';
import { appendMatterEvidence } from '@/lib/matter/evidenceLedger';
import { sanitizeDocumentName } from '@/lib/bluenotary/documents';
import type { BNSignedDocumentResult } from '@/lib/bluenotary/types';
import { decideExecutedCapture, executedArtifactPath, isRonLifecycleState, type ExecutedCaptureDecision } from './evidence';

type Admin = ReturnType<typeof createAdminClient>;
const EXECUTED_BUCKET = 'documents';

export interface CaptureActor {
  actorId: string | null;
  actorRole: string;
  source: 'bluenotary_webhook' | 'milano_seal';
  providerEvent?: string;
}

export interface CapturedArtifact {
  document_name: string;
  sha256: string;
  decision: ExecutedCaptureDecision;
  ron_document_id: string | null;
  document_version_id: string | null;
}

async function resolveExecutedVersion(
  supabase: Admin,
  input: { matterId: string; sessionId: string; ronDocumentId: string; sourceFileId: string | null; sha256: string; storagePath: string; safeName: string; contentType: string; size: number; actor: string },
): Promise<string> {
  const { data: inserted, error } = await supabase
    .from('document_versions')
    .insert({
      matter_id: input.matterId,
      stage: 'executed',
      file_hash: input.sha256,
      actor: input.actor,
      source_file: 'bluenotary_ron_executed',
      file_name: input.safeName,
      mime_type: input.contentType,
      file_size_bytes: input.size,
      storage_bucket: EXECUTED_BUCKET,
      storage_path: input.storagePath,
      source_stage: 'ron_ready',
      source_file_id: input.sourceFileId,
      ron_session_id: input.sessionId,
      ron_document_id: input.ronDocumentId,
      metadata: { immutable: true, provider: 'bluenotary' },
    })
    .select('id')
    .single();
  if (inserted?.id) return inserted.id as string;
  if (error?.code !== '23505') throw new Error(`EXECUTED_VERSION_WRITE_FAILED:${error?.code ?? 'unknown'}`);
  const { data: existing } = await supabase
    .from('document_versions')
    .select('id')
    .eq('ron_session_id', input.sessionId)
    .eq('stage', 'executed')
    .eq('file_hash', input.sha256)
    .single();
  if (!existing?.id) throw new Error('EXECUTED_VERSION_LOOKUP_FAILED');
  return existing.id as string;
}

async function ensureRonDocumentRow(
  supabase: Admin,
  sessionId: string,
  matterId: string,
  safeName: string,
  providerName: string,
) {
  const { data: created, error } = await supabase
    .from('ron_documents')
    .insert({ ron_session_id: sessionId, matter_id: matterId, document_name: safeName, blue_notary_document_name: providerName, document_status: 'PENDING' })
    .select('id, document_id, signed_document_received, executed_sha256')
    .single();
  if (created) return created;
  if (error?.code !== '23505') throw new Error(`RON_DOCUMENT_WRITE_FAILED:${error?.code ?? 'unknown'}`);
  const { data: existing } = await supabase
    .from('ron_documents')
    .select('id, document_id, signed_document_received, executed_sha256')
    .eq('ron_session_id', sessionId)
    .eq('document_name', safeName)
    .single();
  if (!existing) throw new Error('RON_DOCUMENT_LOOKUP_FAILED');
  return existing;
}

/**
 * Captures provider-executed artifacts as immutable, content-addressed versions.
 * Shared by the BlueNotary webhook and the operator retrieval route so both
 * paths obey identical immutability and idempotency rules.
 */
export async function captureExecutedRonDocuments(
  supabase: Admin,
  session: { id: string; matter_id: string; ron_lifecycle_state?: string | null; milano_ron_status?: string | null },
  signedDocs: BNSignedDocumentResult[],
  actor: CaptureActor,
): Promise<CapturedArtifact[]> {
  const ronSessionId = session.id;
  const results: CapturedArtifact[] = [];

  for (const doc of signedDocs) {
    const buffer = Buffer.from(doc.base64_content, 'base64');
    (doc as { base64_content?: string }).base64_content = '';
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    const safeName = sanitizeDocumentName(doc.document_name ?? 'signed_document.pdf') || 'signed_document.pdf';
    const storagePath = executedArtifactPath(session.matter_id, ronSessionId, sha256, safeName);
    const contentType = doc.content_type ?? 'application/pdf';

    const existingDoc = await ensureRonDocumentRow(supabase, ronSessionId, session.matter_id, safeName, doc.document_name);

    if (!existingDoc?.signed_document_received) {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, { contentType, upsert: false });
      if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) {
        throw new Error('EXECUTED_ARTIFACT_STORAGE_FAILED');
      }

      const versionId = await resolveExecutedVersion(supabase, {
        matterId: session.matter_id,
        sessionId: ronSessionId,
        ronDocumentId: existingDoc.id,
        sourceFileId: existingDoc.document_id ?? null,
        sha256,
        storagePath,
        safeName,
        contentType,
        size: buffer.byteLength,
        actor: actor.actorId ?? actor.actorRole,
      });

      const capturedAt = new Date().toISOString();
      const { data: updated } = await supabase
        .from('ron_documents')
        .update({
          blue_notary_document_name: doc.document_name,
          storage_bucket: 'documents',
          signed_storage_path: storagePath,
          signed_document_received: true,
          executed_sha256: sha256,
          executed_document_version_id: versionId,
          executed_size_bytes: buffer.byteLength,
          executed_content_type: contentType,
          executed_captured_at: capturedAt,
          document_status: 'SIGNED',
          updated_at: capturedAt,
        })
        .eq('id', existingDoc.id)
        .eq('signed_document_received', false)
        .select('id')
        .maybeSingle();

      if (!updated) {
        results.push({ document_name: safeName, sha256, decision: 'duplicate', ron_document_id: existingDoc.id, document_version_id: versionId });
        continue;
      }

      const custody = await appendLedger({
        deal_id: session.matter_id,
        event: CUSTODY_EVENTS.DOC_NOTARIZED,
        actor_type: actor.source === 'bluenotary_webhook' ? 'notary' : 'operator',
        actor_id: actor.actorId,
        method: 'remote_online_notarization',
        status: 'EXECUTED',
        notes: 'Executed RON artifact captured as a distinct immutable version.',
        metadata: { ron_session_id: ronSessionId, ron_document_id: existingDoc.id, document_version_id: versionId, sha256, storage_path: storagePath },
      });
      if (custody?.hash) {
        await supabase
          .from('ron_documents')
          .update({ custody_ledger_hash: custody.hash })
          .eq('id', existingDoc.id)
          .is('custody_ledger_hash', null);
      }

      await supabase.from('ron_audit_events').insert({
        matter_id: session.matter_id,
        ron_session_id: ronSessionId,
        event_type: 'RON_EXECUTED_DOCUMENT_CAPTURED',
        description: 'Executed RON artifact captured as an immutable content-addressed version.',
        actor_id: actor.actorId,
        actor_role: actor.actorRole,
        source: actor.source,
        metadata: {
          document_name: safeName,
          sha256,
          storage_bucket: 'documents',
          storage_path: storagePath,
          ron_document_id: existingDoc.id,
          document_version_id: versionId,
          custody_ledger_hash: custody?.hash ?? null,
          immutable: true,
          provider_event: actor.providerEvent ?? null,
        },
      });

      await appendMatterEvidence({
        matterId: session.matter_id,
        eventType: 'RON_EXECUTED_DOCUMENT_CAPTURED',
        domain: 'ron',
        actorType: actor.source === 'bluenotary_webhook' ? 'provider' : 'operator',
        actorId: actor.actorId,
        source: actor.source,
        sourceReference: ronSessionId,
        evidenceReference: storagePath,
        newValue: { sha256, document_version_id: versionId, ron_document_id: existingDoc.id },
        providerEventId: `ron_executed:${ronSessionId}:${sha256}`,
      }).catch(() => undefined);

      results.push({ document_name: safeName, sha256, decision: 'capture', ron_document_id: existingDoc.id, document_version_id: versionId });
      continue;
    }

    const decision = decideExecutedCapture(existingDoc, sha256);
    if (decision === 'conflict') {
      await supabase.from('ron_audit_events').insert({
        matter_id: session.matter_id,
        ron_session_id: ronSessionId,
        event_type: 'RON_EXECUTED_DOCUMENT_CONFLICT',
        description: 'A later provider retrieval returned different bytes for an already-captured executed document. The captured evidence was preserved; operator review required.',
        actor_id: actor.actorId,
        actor_role: actor.actorRole,
        source: actor.source,
        metadata: { document_name: safeName, captured_sha256: existingDoc.executed_sha256 ?? null, retrieved_sha256: sha256, preserved: true },
      });
      await supabase
        .from('ron_sessions')
        .update({ exception_status: 'open', exception_reason: 'executed_document_hash_conflict' })
        .eq('id', ronSessionId)
        .neq('ron_lifecycle_state', 'COMPLETED');
    }
    results.push({ document_name: safeName, sha256, decision, ron_document_id: existingDoc.id, document_version_id: null });
  }

  if (results.some((r) => r.decision !== 'conflict')) {
    const lifecycle = isRonLifecycleState(session.ron_lifecycle_state) ? session.ron_lifecycle_state : 'REQUESTED';
    const update: Record<string, unknown> = { final_documents_status: 'AVAILABLE', updated_at: new Date().toISOString() };
    if (!['RON_COMPLETED', 'READY_FOR_APOSTILLE'].includes(String(session.milano_ron_status ?? ''))) {
      update.milano_ron_status = 'SIGNED_DOCS_RETRIEVED';
    }
    if (lifecycle === 'PROVIDER_SESSION_COMPLETED') update.ron_lifecycle_state = 'EVIDENCE_PENDING';
    await supabase.from('ron_sessions').update(update).eq('id', ronSessionId);
  }

  return results;
}
