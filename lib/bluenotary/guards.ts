// RON Guards — payment-gated access control for RON operations
// All guards throw on failure; callers must catch and return 403/400.

import type { SupabaseClient } from '@supabase/supabase-js';
import { isRonSigningSessionActive } from '@/lib/bluenotary/projection';
import { evaluatePaymentIntegrity } from '@/lib/safety/payment-integrity';
import { evaluateExecutionGate, evaluateSchedulingGate } from '@/lib/scheduling/complimentarySchedulingGate';

export class RONGuardError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'RONGuardError';
  }
}

/** Verify matter exists and the canonical settlement gate is fully verified. */
async function verifyPaymentConfirmed(
  supabase: SupabaseClient,
  matterId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('deals')
    .select('id, deal_id, payment_confirmed, payment_status, payment_settlement_status, amount_paid, amount_due')
    .eq('id', matterId)
    .single();

  if (error || !data) {
    throw new RONGuardError('MATTER_NOT_FOUND', `Matter ${matterId} not found`);
  }

  const integrity = evaluatePaymentIntegrity({
    payment_confirmed: data.payment_confirmed === true,
    is_platform_fee_only: Number(data.amount_due ?? 0) === 0,
    payment_status: data.payment_status,
  });

  if (!integrity.schedulingAllowed) {
    throw new RONGuardError(
      'PAYMENT_NOT_CONFIRMED',
      `Payment is not verified. Current settlement state: ${data.payment_settlement_status ?? data.payment_status ?? 'unknown'}`
    );
  }

  const amountPaid = Number(data.amount_paid ?? 0);
  const amountDue = Number(data.amount_due ?? 0);
  if (amountDue > 0 && amountPaid + 0.005 < amountDue) {
    throw new RONGuardError(
      'PAYMENT_INSUFFICIENT',
      `Verified payment amount (${amountPaid}) is less than amount due (${amountDue})`
    );
  }
}

/** Verify canonical Wise scheduling authority without manufacturing paid truth. */
async function verifySchedulingAuthorized(
  supabase: SupabaseClient,
  matterId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('deals')
    .select('id, deal_id, payment_confirmed, payment_status, payment_settlement_status, payment_observed_at, payment_observed_amount, payment_observed_currency, payment_observed_reference, currency, wise_reference, amount_paid, amount_due, payment_disposition, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, verified_revenue')
    .eq('id', matterId)
    .single();

  if (error || !data) {
    throw new RONGuardError('MATTER_NOT_FOUND', `Matter ${matterId} not found`);
  }

  const schedulingGate = evaluateSchedulingGate({ matter: data });
  if (!schedulingGate.schedulingEligible) {
    throw new RONGuardError(
      'PAYMENT_REQUIRED',
      schedulingGate.reason
    );
  }
}

/** Execution and signer-link release require the same exact verified Wise settlement as
 * scheduling (founder decision 2026-11-09). Final international release remains governed
 * by its separate release controls. */
async function verifyExecutionPaymentAuthorized(
  supabase: SupabaseClient,
  matterId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('deals')
    .select('id, deal_id, payment_confirmed, payment_status, payment_settlement_status, payment_observed_at, payment_observed_amount, payment_observed_currency, payment_observed_reference, currency, wise_reference, wise_transaction_reference, payment_funding_method, payment_attempt_id, payment_attempt_started_at, wise_provider_evidence, amount_paid, amount_due, payment_disposition, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, verified_revenue')
    .eq('id', matterId)
    .single();

  if (error || !data) {
    throw new RONGuardError('MATTER_NOT_FOUND', `Matter ${matterId} not found`);
  }

  const gate = evaluateExecutionGate(data);
  if (!gate.schedulingEligible) {
    throw new RONGuardError('PAYMENT_REQUIRED', gate.reason);
  }
}

/**
 * Verify that a RON session can be created for a matter.
 * Checks: canonical scheduling authority, RON truth, notarial act, no active session, signer data.
 */
export async function assertCanCreateRONSession(
  supabase: SupabaseClient,
  matterId: string,
  _userId: string
): Promise<void> {
  await verifySchedulingAuthorized(supabase, matterId);

  const { data: matter, error: matterError } = await supabase
    .from('deals')
    .select('client_name, email, phone, execution_truth')
    .eq('id', matterId)
    .single();

  if (matterError || !matter) {
    throw new RONGuardError('MATTER_NOT_FOUND', `Matter ${matterId} not found`);
  }

  const truth = (matter.execution_truth ?? {}) as Record<string, unknown>;
  if (truth.notarization_requirement !== 'required' || truth.execution_method !== 'ron') {
    throw new RONGuardError('RON_NOT_AUTHORIZED', 'Canonical Matter truth does not authorize Remote Online Notarization');
  }

  if (!truth.signer_location || !truth.notary_jurisdiction) {
    throw new RONGuardError('RON_JURISDICTION_INCOMPLETE', 'Signer location and notary jurisdiction must be confirmed before RON scheduling');
  }

  if (!truth.notarial_act || truth.notarial_act === 'review_required' || truth.notarial_act === 'unknown') {
    throw new RONGuardError('NOTARIAL_ACT_REVIEW_REQUIRED', 'Operator must confirm the notarial act before creating a BlueNotary session');
  }

  const { data: existing } = await supabase
    .from('ron_sessions')
    .select('id, milano_ron_status, ron_lifecycle_state')
    .eq('matter_id', matterId)
    .not('milano_ron_status', 'in', '("RON_EXPIRED","RON_COMPLETED")')
    .maybeSingle();

  if (existing) {
    throw new RONGuardError(
      'ACTIVE_SESSION_EXISTS',
      `An active RON session already exists for matter ${matterId} (status: ${existing.milano_ron_status})`
    );
  }

  if (!matter.client_name || !matter.email || !matter.phone) {
    throw new RONGuardError(
      'SIGNER_DATA_INCOMPLETE',
      'Signer name, email, and phone are required before creating a RON session'
    );
  }
}

/** Release signing access only through verified-settlement authority. */
export async function assertCanReleaseSigningURL(
  supabase: SupabaseClient,
  matterId: string,
  ronSessionId: string
): Promise<void> {
  await verifyExecutionPaymentAuthorized(supabase, matterId);

  const { data: session } = await supabase
    .from('ron_sessions')
    .select('id, milano_ron_status, ron_lifecycle_state, expired_at')
    .eq('id', ronSessionId)
    .eq('matter_id', matterId)
    .single();

  if (!session) throw new RONGuardError('SESSION_NOT_FOUND', `RON session ${ronSessionId} not found`);
  if (!isRonSigningSessionActive(session)) {
    throw new RONGuardError('SESSION_EXPIRED', 'This RON session has expired');
  }

  const { data: signer } = await supabase
    .from('ron_signers')
    .select('id, email')
    .eq('ron_session_id', ronSessionId)
    .maybeSingle();
  if (!signer) throw new RONGuardError('SIGNER_NOT_FOUND', 'No signer found for this RON session');
}

/** Retrieve provider artifacts after provider completion, including governed evidence correction. */
export async function assertCanRetrieveSignedDocuments(
  supabase: SupabaseClient,
  ronSessionId: string
): Promise<void> {
  const { data: session } = await supabase
    .from('ron_sessions')
    .select('id, milano_ron_status, ron_lifecycle_state, provider_completed_at, provider_session_completed_at, blue_notary_status, evidence_reopened_at')
    .eq('id', ronSessionId)
    .single();
  if (!session) throw new RONGuardError('SESSION_NOT_FOUND', `RON session ${ronSessionId} not found`);

  // SESSION_PROCESSING / RON_REVIEW_REQUIRED are presentation states, not
  // proof that the provider actually completed its session. Old P4 sessions
  // may lack the newer lifecycle marker; they must carry an independently
  // recorded provider completion timestamp plus verified provider status.
  const lifecycleCompleted = ['PROVIDER_SESSION_COMPLETED', 'EVIDENCE_PENDING'].includes(session.ron_lifecycle_state);
  const recordedProviderCompletion = Boolean(session.provider_completed_at || session.provider_session_completed_at) &&
    session.blue_notary_status === 'COMPLETED';
  // A legacy RON_REVIEW_REQUIRED correction requires the governed reopening
  // record; the newer P4B EVIDENCE_PENDING lifecycle is already its proof.
  const correctionPermitted = session.milano_ron_status !== 'RON_REVIEW_REQUIRED' ||
    Boolean(session.evidence_reopened_at);
  const providerCompleted = lifecycleCompleted || (recordedProviderCompletion && correctionPermitted);
  if (['FAILED', 'CANCELLED'].includes(session.ron_lifecycle_state) ||
      session.milano_ron_status === 'RON_EXPIRED' || !providerCompleted) {
    throw new RONGuardError('SESSION_NOT_COMPLETED', `Provider session completion is required before retrieving signed documents (current: ${session.ron_lifecycle_state ?? session.milano_ron_status})`);
  }
}

/** Authoritative Milano completion remains separate from provider retrieval. */
export async function assertRonExecutionCompleted(
  supabase: SupabaseClient,
  ronSessionId: string
): Promise<void> {
  const { data: session } = await supabase.from('ron_sessions').select('id, ron_lifecycle_state').eq('id', ronSessionId).single();
  if (!session) throw new RONGuardError('SESSION_NOT_FOUND', `RON session ${ronSessionId} not found`);
  if (session.ron_lifecycle_state !== 'COMPLETED') {
    throw new RONGuardError('RON_EVIDENCE_NOT_VERIFIED', 'RON statutory evidence must be verified and the session completed by Milano before the Matter can advance');
  }
}

/** Verify that a matter can advance to Apostille after RON. */
export async function assertCanAdvanceToApostille(
  supabase: SupabaseClient,
  matterId: string,
  ronSessionId: string
): Promise<void> {
  await verifyExecutionPaymentAuthorized(supabase, matterId);

  const { data: session } = await supabase
    .from('ron_sessions')
    .select('id, milano_ron_status, final_documents_status')
    .eq('id', ronSessionId)
    .eq('matter_id', matterId)
    .single();
  if (!session) throw new RONGuardError('SESSION_NOT_FOUND', `RON session ${ronSessionId} not found`);

  const statutory = await supabase.rpc('ron_statutory_evidence_verified', {p_session:ronSessionId});
  if (statutory.error || statutory.data !== true) throw new RONGuardError('STATUTORY_EVIDENCE_REQUIRED','Operator-verified statutory evidence and QC are required before progression');

  if (!['RON_COMPLETED','SIGNED_DOCS_RETRIEVED','READY_FOR_APOSTILLE'].includes(session.milano_ron_status)) {
    throw new RONGuardError('SIGNED_DOCS_NOT_RETRIEVED', 'Signed documents must be retrieved and stored before advancing to Apostille');
  }

  await assertRonExecutionCompleted(supabase, ronSessionId);

  const { data: docs } = await supabase
    .from('ron_documents')
    .select('id, signed_document_received, executed_sha256')
    .eq('ron_session_id', ronSessionId)
    .eq('signed_document_received', true)
    .not('executed_sha256', 'is', null);
  if (!docs || docs.length === 0) throw new RONGuardError('NO_SIGNED_DOCUMENTS', 'No signed documents have been received for this session');
}
