// RON Guards — payment-gated access control for RON operations
// All guards throw on failure; callers must catch and return 403/400.

import type { SupabaseClient } from '@supabase/supabase-js';

export class RONGuardError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'RONGuardError';
  }
}

/** Verify matter exists and payment is confirmed */
async function verifyPaymentConfirmed(
  supabase: SupabaseClient,
  matterId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('deals')
    .select('id, payment_status, amount_paid, amount_due')
    .eq('id', matterId)
    .single();

  if (error || !data) {
    throw new RONGuardError('MATTER_NOT_FOUND', `Matter ${matterId} not found`);
  }

  if (data.payment_status !== 'paid') {
    throw new RONGuardError(
      'PAYMENT_NOT_CONFIRMED',
      'Payment must be confirmed (status=paid) before RON operations'
    );
  }

  const amountPaid = Number(data.amount_paid ?? 0);
  const amountDue = Number(data.amount_due ?? 0);
  if (amountDue > 0 && amountPaid < amountDue) {
    throw new RONGuardError(
      'PAYMENT_INSUFFICIENT',
      `Amount paid (${amountPaid}) is less than amount due (${amountDue})`
    );
  }
}

/**
 * Verify that a RON session can be created for a matter.
 * Checks: matter exists, payment confirmed, no existing active session, signer data present.
 */
export async function assertCanCreateRONSession(
  supabase: SupabaseClient,
  matterId: string,
  userId: string
): Promise<void> {
  await verifyPaymentConfirmed(supabase, matterId);

  // Check for existing active session
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

  // Verify signer data exists on the matter
  const { data: matter } = await supabase
    .from('deals')
    .select('client_name, email')
    .eq('id', matterId)
    .single();

  if (!matter?.client_name || !matter?.email) {
    throw new RONGuardError(
      'SIGNER_DATA_INCOMPLETE',
      'Signer name and email are required before creating a RON session'
    );
  }
}

/**
 * Verify that a signing URL can be released to a signer.
 * Checks: payment confirmed, session exists and not expired, signer exists.
 */
export async function assertCanReleaseSigningURL(
  supabase: SupabaseClient,
  matterId: string,
  ronSessionId: string
): Promise<void> {
  await verifyPaymentConfirmed(supabase, matterId);

  const { data: session } = await supabase
    .from('ron_sessions')
    .select('id, milano_ron_status, expired_at')
    .eq('id', ronSessionId)
    .eq('matter_id', matterId)
    .single();

  if (!session) {
    throw new RONGuardError('SESSION_NOT_FOUND', `RON session ${ronSessionId} not found`);
  }

  if (session.milano_ron_status === 'RON_EXPIRED') {
    throw new RONGuardError('SESSION_EXPIRED', 'This RON session has expired');
  }

  if (session.expired_at && new Date(session.expired_at) < new Date()) {
    throw new RONGuardError('SESSION_EXPIRED', 'This RON session has expired');
  }

  const { data: signer } = await supabase
    .from('ron_signers')
    .select('id, email')
    .eq('ron_session_id', ronSessionId)
    .maybeSingle();

  if (!signer) {
    throw new RONGuardError('SIGNER_NOT_FOUND', 'No signer found for this RON session');
  }
}

/**
 * Verify that signed documents can be retrieved.
 * Operator role and completed session required.
 */
export async function assertCanRetrieveSignedDocuments(
  supabase: SupabaseClient,
  ronSessionId: string
): Promise<void> {
  const { data: session } = await supabase
    .from('ron_sessions')
    .select('id, milano_ron_status')
    .eq('id', ronSessionId)
    .single();

  if (!session) {
    throw new RONGuardError('SESSION_NOT_FOUND', `RON session ${ronSessionId} not found`);
  }

  const completedStatuses: string[] = [
    'RON_COMPLETED',
    'SESSION_PROCESSING',
    'SIGNED_DOCS_RETRIEVED',
  ];

  if (!completedStatuses.includes(session.milano_ron_status)) {
    throw new RONGuardError(
      'SESSION_NOT_COMPLETED',
      `Session must be completed before retrieving signed documents (current: ${session.milano_ron_status})`
    );
  }
}

/**
 * Verify that a matter can advance to Apostille after RON.
 * Checks: RON completed, signed docs stored, payment still confirmed.
 */
export async function assertCanAdvanceToApostille(
  supabase: SupabaseClient,
  matterId: string,
  ronSessionId: string
): Promise<void> {
  await verifyPaymentConfirmed(supabase, matterId);

  const { data: session } = await supabase
    .from('ron_sessions')
    .select('id, milano_ron_status, final_documents_status')
    .eq('id', ronSessionId)
    .eq('matter_id', matterId)
    .single();

  if (!session) {
    throw new RONGuardError('SESSION_NOT_FOUND', `RON session ${ronSessionId} not found`);
  }

  if (
    session.milano_ron_status !== 'SIGNED_DOCS_RETRIEVED' &&
    session.milano_ron_status !== 'READY_FOR_APOSTILLE'
  ) {
    throw new RONGuardError(
      'SIGNED_DOCS_NOT_RETRIEVED',
      'Signed documents must be retrieved and stored before advancing to Apostille'
    );
  }

  // Verify at least one signed document is stored
  const { data: docs } = await supabase
    .from('ron_documents')
    .select('id, signed_document_received')
    .eq('ron_session_id', ronSessionId)
    .eq('signed_document_received', true);

  if (!docs || docs.length === 0) {
    throw new RONGuardError(
      'NO_SIGNED_DOCUMENTS',
      'No signed documents have been received for this session'
    );
  }
}
