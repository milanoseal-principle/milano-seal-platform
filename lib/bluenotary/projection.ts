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
 * `payment_gate_status = UNLOCKED` is scheduling/execution authority recorded
 * on the canonical RON session. It is NOT a claim that Wise settlement has
 * completed. Verified settlement remains canonical Matter/payment truth.
 *
 * Signing URL is ONLY included when ALL of:
 *   1. signing_url_released = true on the matching signer record
 *   2. Session is active
 *   3. Signer email matches the requesting portal user
 *   4. canonical RON scheduling/execution gate is unlocked
 */
export function portalRONProjection(
  ronSession: RONSession,
  signers: RONSigner[],
  signerEmail: string
): PortalRONView {
  const status = ronSession.milano_ron_status;
  const schedulingAuthorized = ronSession.payment_gate_status === 'UNLOCKED';
  const sessionActive = ACTIVE_RON_STATUSES.includes(status);

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
    signingUrl = matchingSigner.signing_url_encrypted;
  }

  return {
    session_id: ronSession.id,
    milano_ron_status: status,
    client_label: getClientStatusLabel(status),
    // Backward-compatible field only. Never render it as verified Wise settlement.
    payment_confirmed: schedulingAuthorized,
    scheduling_authorized: schedulingAuthorized,
    session_active: sessionActive,
    signing_url: signingUrl ?? null,
    coordinator_message:
      'Your online notarization session is coordinated through a secure execution process. Your coordinator will release session access when your Matter is ready.',
    identity_status: ronSession.identity_status,
    kba_status: ronSession.kba_status,
  };
}
