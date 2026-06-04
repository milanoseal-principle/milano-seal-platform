import { createHash } from 'crypto';
import type { BNWebhookPayload } from './types';

export type BNWebhookAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; reason: 'unauthorized' | 'misconfigured' };

/**
 * Verify Authorization Bearer on incoming BlueNotary webhook requests.
 * Returns a typed result so callers can distinguish 401 vs 500.
 * Never logs the token or secret.
 */
export function verifyBNWebhookAuth(request: Request): BNWebhookAuthResult {
  const secret = process.env.BLUENOTARY_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, status: 500, reason: 'misconfigured' };
  }

  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader === `Bearer ${secret}`) {
    return { ok: true };
  }

  return { ok: false, status: 401, reason: 'unauthorized' };
}

/**
 * Compute a SHA-256 hash for idempotency deduplication of webhook events.
 */
export function computeEventHash(payload: BNWebhookPayload): string {
  const raw = [
    payload.notarization_id ?? '',
    payload.bn_session_id ?? '',
    payload.event_type ?? '',
    payload.message ?? '',
  ].join('|');

  return createHash('sha256').update(raw).digest('hex');
}
