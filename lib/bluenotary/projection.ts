// BlueNotary portal-safe projection
// NEVER expose raw BN status, raw_session jsonb, base64, or signing URLs
// unless all gate conditions are met.

import type { RONSession, RONSigner, PortalRONView, MilanoRONStatus } from './types';
import { getClientStatusLabel } from './status';

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

/**
 * Project a RON session + signer list to a client-safe portal view.
 *
 * Signing URL is ONLY included when ALL of:
 *   1. signing_url_released = true on the matching signer record
 *   2. Session is in an active status (not expired/completed)
 *   3. Signer email matches the requesting user's email
 *   4. payment_gate_status = 'UNLOCKED' (canonical scheduling authority)
 *
 * IMPORTANT: payment_gate_status is scheduling authority only. This projection
 * never authors or infers verified Wise settlement truth.
 */
export function portalRONProjection(
  ronSession: RONSession,
  signers: RONSigner[],
  signerEmail: string
): PortalRONView {
  const terminal = ['RON_COMPLETED','SIGNED_DOCS_RETRIEVED','READY_FOR_APOSTILLE'].includes(ronSession.milano_ron_status);
  const status = terminal && (!ronSession.statutory_evidence_id || ronSession.statutory_evidence_verified !== true || !!ronSession.evidence_reopened_at) ? 'RON_REVIEW_REQUIRED' : ronSession.milano_ron_status;
  const schedulingAuthorized = ronSession.payment_gate_status === 'UNLOCKED';
  const sessionActive = !ronSession.provider_completed_at && ACTIVE_RON_STATUSES.includes(status);

  const matchingSigner = signers.find(
    (s) => s.email?.toLowerCase() === signerEmail.toLowerCase()
  );

  let signingUrl: string | undefined;

  if (
    matchingSigner &&
    matchingSigner.signing_url_released === true &&
    schedulingAuthorized &&
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
    client_label: getClientStatusLabel(status),
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
