import type { createAdminClient } from '@/lib/supabase/admin';
import { isRonLifecycleState, type RonEvidenceInput, type RonLifecycleState } from './evidence';

type Admin = ReturnType<typeof createAdminClient>;

export const SESSION_EVIDENCE_SELECT =
  'id, matter_id, notarization_id, bn_session_id, provider_name, ron_lifecycle_state, milano_ron_status, requested_at, provider_accepted_at, provider_session_completed_at, execution_completed_at, notary_name, notary_provider_reference, notary_commission_number, notary_commission_jurisdiction, notary_commission_expires_on, notary_ron_registration_reference, notarial_act_type, notarial_act_count, certificate_completion_reference, electronic_signature_reference, electronic_seal_reference, witness_requirement, journal_reference, av_recording_reference, provider_evidence_references, provider_fee_evidence_classification, provider_fee_evidence_reference, retention_class, retention_rule, retention_start_at, retention_until, qc_status, qc_review_reference, qc_recorded_at, exception_status, exception_reason, evidence_verified_at, evidence_verified_by, evidence_verification_hash, completed_at, milano_completed_by, created_at, updated_at';

export const SIGNER_EVIDENCE_SELECT =
  'id, ron_session_id, signer_index, first_name, last_name, party_role, signer_reference, signer_location_jurisdiction, signer_location_evidence_reference, identity_proofing_result, identity_proofing_reference, credential_analysis_result, credential_analysis_reference, kba_result, kba_reference, awareness_willingness_confirmed_at, awareness_willingness_reference, oath_administered_at, oath_reference, witness_appearance, witness_evidence_reference';

export const DOCUMENT_EVIDENCE_SELECT =
  'id, document_id, document_name, storage_path, signed_storage_path, signed_document_received, executed_sha256, executed_document_version_id, executed_size_bytes, executed_content_type, executed_captured_at, custody_ledger_hash';

export async function loadRonEvidence(supabase: Admin, sessionId: string) {
  const { data: session } = await supabase.from('ron_sessions').select(SESSION_EVIDENCE_SELECT).eq('id', sessionId).maybeSingle();
  if (!session) return null;
  const [{ data: signers }, { data: documents }, { data: matter }] = await Promise.all([
    supabase.from('ron_signers').select(SIGNER_EVIDENCE_SELECT).eq('ron_session_id', sessionId).order('signer_index'),
    supabase.from('ron_documents').select(DOCUMENT_EVIDENCE_SELECT).eq('ron_session_id', sessionId),
    supabase.from('deals').select('id, deal_id, status, execution_truth').eq('id', session.matter_id).maybeSingle(),
  ]);
  const lifecycle: RonLifecycleState = isRonLifecycleState(session.ron_lifecycle_state) ? session.ron_lifecycle_state : 'REQUESTED';
  const input: RonEvidenceInput = {
    matterFound: Boolean(matter),
    executionTruth: (matter?.execution_truth ?? null) as Record<string, unknown> | null,
    session,
    signers: signers ?? [],
    documents: documents ?? [],
  };
  return { session, signers: signers ?? [], documents: documents ?? [], matter, lifecycle, input };
}

// The database function is the authoritative fail-closed check; null means it could not be evaluated.
export async function databaseMissingEvidence(supabase: Admin, sessionId: string): Promise<string[] | null> {
  const { data, error } = await supabase.rpc('ron_session_missing_evidence_by_id', { p_session_id: sessionId });
  if (error || !Array.isArray(data)) return null;
  return data as string[];
}

export function ronRouteError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/NEXT_REDIRECT|Unauthorized|access_denied/.test(message)) return { status: 401, body: { ok: false, code: 'UNAUTHORIZED' } };
  return { status: 500, body: { ok: false, code: 'INTERNAL_SERVER_ERROR', message: 'The request did not complete. No evidence was changed unless confirmed in the audit trail; retry is safe.' } };
}
