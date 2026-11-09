// BlueNotary portal-safe projection
// NEVER expose raw BN status, raw_session jsonb, base64, or signing URLs
// unless all gate conditions are met.

import type { RONSession, RONSigner, PortalRONView, MilanoRONStatus } from './types';
import { getClientStatusLabel } from './status';
import { clientRonLifecycleLabel, isRonLifecycleState } from '@/lib/ron/evidence';

const ACTIVE_RON_STATUSES: MilanoRONStatus[] = [
  'RON_SESSION_CREATED',
  'SIGNER_INVITED',
  'SIGNING_LINK_RELEASED',
  'IDENTITY_STARTED',
  'PHOTO_ID_PASSED',
  'BIOMETRICS_PASSED',
  'KBA_STARTED',
  'KBA_PASSED',
  'NOTARY_ACCEPTED',
  'SESSION_JOINED',
  'SESSION_STARTED',
  'SESSION_PROCESSING',
];

/** Signing access ends on provider completion, cancellation, failure or expiry. */
export function isRonSigningSessionActive(session: Pick<RONSession, 'milano_ron_status' | 'ron_lifecycle_state' | 'expired_at'>, now = Date.now()): boolean {
  const lifecycle = session.ron_lifecycle_state;
  const expiry = session.expired_at == null ? null : Date.parse(session.expired_at);
  return ACTIVE_RON_STATUSES.includes(session.milano_ron_status) &&
    ['REQUESTED', 'STARTED', 'PROVIDER_ACCEPTED'].includes(String(lifecycle)) &&
    (expiry === null || (Number.isFinite(expiry) && expiry > now));
}

/**
 * Project a RON session + signer list to a client-safe portal view.
 *
 * Signing URL is ONLY included when ALL of:
 *   1. signing_url_released = true on the matching signer record
 *   2. Session is in an active status (not expired/completed)
 *   3. Signer email matches the requesting user's email
 *   4. Current canonical execution authority was re-evaluated by the server
 *
 * IMPORTANT: payment_gate_status is scheduling authority only. This projection
 * never authors or infers verified Wise settlement truth.
 */
export function portalRONProjection(
  ronSession: RONSession,
  signers: RONSigner[],
  signerEmail: string,
  authority: { schedulingAuthorized: boolean; executionAuthorized: boolean } = { schedulingAuthorized: false, executionAuthorized: false },
): PortalRONView {
  const lifecycle = isRonLifecycleState(ronSession.ron_lifecycle_state) ? ronSession.ron_lifecycle_state : 'REQUESTED';
  const terminal = ['RON_COMPLETED','SIGNED_DOCS_RETRIEVED','READY_FOR_APOSTILLE'].includes(ronSession.milano_ron_status);
  const status = terminal && (!ronSession.statutory_evidence_id || ronSession.statutory_evidence_verified !== true || !!ronSession.evidence_reopened_at)
    ? 'RON_REVIEW_REQUIRED'
    : ronSession.milano_ron_status;
  const schedulingAuthorized = authority.schedulingAuthorized;
  const sessionActive = isRonSigningSessionActive({ ...ronSession, milano_ron_status: status });

  const matchingSigner = signers.find(
    (s) => s.email?.toLowerCase() === signerEmail.toLowerCase()
  );

  let signingUrl: string | undefined;

  if (
    matchingSigner &&
    matchingSigner.signing_url_released === true &&
    authority.executionAuthorized &&
    sessionActive &&
    matchingSigner.signing_url_encrypted
  ) {
    // signing_url_encrypted is stored as the plaintext URL at this layer
    // (encryption/decryption handled at the API route level if needed)
    signingUrl = matchingSigner.signing_url_encrypted;
  }

  return {
    session_id: ronSession.id,
    milano_ron_status: status,
    ron_lifecycle_state: lifecycle,
    // Only verified Milano completion is presented as completion to the client.
    milano_completed: lifecycle === 'COMPLETED',
    client_label: ['REQUESTED', 'STARTED', 'PROVIDER_ACCEPTED'].includes(lifecycle)
      ? getClientStatusLabel(status)
      : clientRonLifecycleLabel(lifecycle),
    scheduling_authorized: schedulingAuthorized,
    session_active: sessionActive,
    signing_url: signingUrl ?? null,
    coordinator_message:
      'Your online notarization session is coordinated through a secure execution process. Your coordinator will release session access when your matter is ready.',
    identity_status: ronSession.identity_status,
    kba_status: ronSession.kba_status,
    // NOTE: Never include raw_session, blue_notary_status, bn_session_id,
    // notarization_id, storage_path, internal notes, or Wise settlement truth.
  };
}
