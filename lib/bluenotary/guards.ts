// RON Guards — payment-gated access control for RON operations
// All guards throw on failure; callers must catch and return 403/400.

import type { SupabaseClient } from '@supabase/supabase-js';
import { evaluatePaymentIntegrity } from '@/lib/safety/payment-integrity';
import { evaluateSchedulingGate } from '@/lib/scheduling/complimentarySchedulingGate';

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
    .select('id, payment_confirmed, payment_status, payment_settlement_status, amount_paid, amount_due, is_platform_fee_only')
    .eq('id', matterId)
    .single();

  if (error || !data) {
    throw new RONGuardError('MATTER_NOT_FOUND', `Matter ${matterId} not found`);
  }

  const integrity = evaluatePaymentIntegrity({
    payment_confirmed: data.payment_confirmed === true,
    is_platform_fee_only: data.is_platform_fee_only === true,
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
  if (!data.is_platform_fee_only && amountDue > 0 && amountPaid + 0.005 < amountDue) {
    throw new RONGuardError(
      'PAYMENT_INSUFFICIENT',
      `Verified payment amount (${amountPaid}) is less than amount due (${amountDue})`
    );
  }
}

/**
 * Verify that payment authorizes scheduling. A client's recorded Wise submission
 * is enough to reserve scheduling capacity, but it does not become provider
 * evidence and it never authors paid state.
 */
async function verifySchedulingAuthorized(
  supabase: SupabaseClient,
  matterId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('deals')
    .select('id, payment_confirmed, payment_status, payment_settlement_status, payment_observed_at, amount_paid, amount_due, is_platform_fee_only, payment_disposition, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, verified_revenue')
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

/**
 * Execution authority is intentionally stronger than a client's self-reported
 * payment submission and intentionally weaker than final settlement clearance.
 *
 * - verified/cleared Wise payment: execution may proceed
 * - authorized complimentary Matter: execution may proceed under its own gate
 * - Wise acquiring payment located directly through the Wise API while still
 *   processing: execution may proceed, but paid/cleared state remains false
 * - client-only "I paid" observation with no Wise provider evidence: scheduling
 *   may be reserved, but signer-link release remains blocked
 *
 * Final international release remains governed by the separate cleared-payment
 * release controls and is never authorized by this helper.
 */
async function verifyExecutionPaymentAuthorized(
  supabase: SupabaseClient,
  matterId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('deals')
    .select('id, payment_confirmed, payment_status, payment_settlement_status, payment_observed_at, wise_transaction_reference, payment_funding_method, amount_paid, amount_due, is_platform_fee_only, payment_disposition, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, verified_revenue')
    .eq('id', matterId)
    .single();

  if (error || !data) {
    throw new RONGuardError('MATTER_NOT_FOUND', `Matter ${matterId} not found`);
  }

  const schedulingGate = evaluateSchedulingGate({ matter: data });
  if (!schedulingGate.schedulingEligible) {
    throw new RONGuardError('PAYMENT_REQUIRED', schedulingGate.reason);
  }

  if (schedulingGate.paymentRequirementMethod === 'wise_submission_observed') {
    const providerEvidence =
      typeof data.wise_transaction_reference === 'string' &&
      data.wise_transaction_reference.trim().length > 0 &&
      data.payment_funding_method === 'wise_acquiring_payment';

    if (!providerEvidence) {
      throw new RONGuardError(
        'WISE_PROVIDER_EVIDENCE_REQUIRED',
        'Wise must expose the submitted payment to Milano server-side reconciliation before the signing link can be released'
      );
    }
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
    .select('id, milano_ron_status')
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

/**
 * A provider-evidenced acquiring payment may authorize execution while Wise
 * settles the merchant-side credit. This does not mark the Matter paid and does
 * not weaken final international-release clearance.
 */
export async function assertCanReleaseSigningURL(
  supabase: SupabaseClient,
  matterId: string,
  ronSessionId: string
): Promise<void> {
  await verifyExecutionPaymentAuthorized(supabase, matterId);

  const { data: session } = await supabase
    .from('ron_sessions')
    .select('id, milano_ron_status, expired_at')
    .eq('id', ronSessionId)
    .eq('matter_id', matterId)
    .single();

  if (!session) throw new RONGuardError('SESSION_NOT_FOUND', `RON session ${ronSessionId} not found`);
  if (session.milano_ron_status === 'RON_EXPIRED' || (session.expired_at && new Date(session.expired_at) < new Date())) {
    throw new RONGuardError('SESSION_EXPIRED', 'This RON session has expired');
  }

  const { data: signer } = await supabase
    .from('ron_signers')
    .select('id, email')
    .eq('ron_session_id', ronSessionId)
    .maybeSingle();
  if (!signer) throw new RONGuardError('SIGNER_NOT_FOUND', 'No signer found for this RON session');
}

/** Verify that signed documents can be retrieved after a completed provider session. */
export async function assertCanRetrieveSignedDocuments(
  supabase: SupabaseClient,
  ronSessionId: string
): Promise<void> {
  const { data: session } = await supabase
    .from('ron_sessions')
    .select('id, milano_ron_status')
    .eq('id', ronSessionId)
    .single();
  if (!session) throw new RONGuardError('SESSION_NOT_FOUND', `RON session ${ronSessionId} not found`);

  const completedStatuses = ['RON_COMPLETED', 'SESSION_PROCESSING', 'SIGNED_DOCS_RETRIEVED'];
  if (!completedStatuses.includes(session.milano_ron_status)) {
    throw new RONGuardError('SESSION_NOT_COMPLETED', `Session must be completed before retrieving signed documents (current: ${session.milano_ron_status})`);
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

  if (session.milano_ron_status !== 'SIGNED_DOCS_RETRIEVED' && session.milano_ron_status !== 'READY_FOR_APOSTILLE') {
    throw new RONGuardError('SIGNED_DOCS_NOT_RETRIEVED', 'Signed documents must be retrieved and stored before advancing to Apostille');
  }

  const { data: docs } = await supabase
    .from('ron_documents')
    .select('id, signed_document_received')
    .eq('ron_session_id', ronSessionId)
    .eq('signed_document_received', true);
  if (!docs || docs.length === 0) throw new RONGuardError('NO_SIGNED_DOCUMENTS', 'No signed documents have been received for this session');
}
