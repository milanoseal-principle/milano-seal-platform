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
 *   4. payment_gate_status = 'UNLOCKED'
 */
export function portalRONProjection(
  ronSession: RONSession,
  signers: RONSigner[],
  signerEmail: string
): PortalRONView {
  const status = ronSession.milano_ron_status;
  const paymentConfirmed = ronSession.payment_gate_status === 'UNLOCKED';
  const sessionActive = ACTIVE_RON_STATUSES.includes(status);

  // Find the signer matching the requesting portal user
  const matchingSigner = signers.find(
    (s) => s.email?.toLowerCase() === signerEmail.toLowerCase()
  );

  let signingUrl: string | undefined;

  if (
    matchingSigner &&
    matchingSigner.signing_url_released === true &&
    paymentConfirmed &&
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
    payment_confirmed: paymentConfirmed,
    scheduling_authorized: paymentConfirmed,
    session_active: sessionActive,
    signing_url: signingUrl ?? null,
    coordinator_message:
      'Your online notarization session is coordinated through a secure execution process. Your coordinator will release session access when your matter is ready.',
    identity_status: ronSession.identity_status,
    kba_status: ronSession.kba_status,
    // NOTE: Never include raw_session, blue_notary_status, bn_session_id,
    // notarization_id, storage_path, or internal notes in this projection.
  };
}
