import type { BNCreateSessionPayload, BNSignerPayload } from './types';

/**
 * Build a unique notarization ID for a matter.
 * Format: MS-RON-{matterShortId}-{timestamp}
 */
export function buildNotarizationId(matterShortId: string): string {
  const ts = Date.now();
  return `MS-RON-${matterShortId}-${ts}`;
}

export interface MatterForSession {
  id: string;
  client_name?: string | null;
  email?: string | null;
  phone?: string | null;
  document_type?: string | null;
  destination_country?: string | null;
  short_id?: string | null;
}

export interface SignerForSession {
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  state?: string;
  authentication_type?: string;
  signer_index?: number;
}

/**
 * Build the top-level notarization creation payload for BlueNotary.
 * Signers and documents are passed in separately.
 */
export function buildSessionPayload(
  matter: MatterForSession,
  signers: SignerForSession[],
  sessionTiming?: string // ISO 8601 — undefined = open/immediate
): BNCreateSessionPayload {
  const notarizationId = buildNotarizationId(
    matter.short_id ?? matter.id.slice(0, 8)
  );

  return {
    notarization_id: notarizationId,
    signing_type: 'ron',
    session_type: 'notarization',
    notarization_timing_type: sessionTiming ? 'scheduled' : 'open',
    ...(sessionTiming ? { session_timing: sessionTiming } : {}),
    signers: signers.map((s, i) => buildSignerPayload(s, i)),
  };
}

/**
 * Build a signer payload for BlueNotary.
 * Never include sensitive fields beyond what BN requires.
 */
export function buildSignerPayload(
  signer: SignerForSession,
  index?: number
): BNSignerPayload {
  return {
    first_name: signer.first_name,
    ...(signer.middle_name ? { middle_name: signer.middle_name } : {}),
    last_name: signer.last_name,
    email: signer.email,
    ...(signer.phone ? { phone: signer.phone } : {}),
    ...(signer.state ? { state: signer.state } : {}),
    authentication_type: signer.authentication_type ?? 'kba',
    signer_index: index ?? signer.signer_index ?? 0,
  };
}
