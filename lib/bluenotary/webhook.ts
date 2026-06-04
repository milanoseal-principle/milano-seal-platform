import { createHash } from 'crypto';
import type { BNWebhookPayload } from './types';

/**
 * Verify the Authorization Bearer token on incoming BlueNotary webhook requests.
 * Returns true if valid, false if missing or mismatched.
 * Never logs the token or secret.
 */
export function verifyBNWebhookAuth(request: Request): boolean {
  const secret = process.env.BLUENOTARY_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed — if secret is not configured, reject all webhooks
    return false;
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return false;

  const token = authHeader.slice('Bearer '.length).trim();

  // Constant-time comparison to prevent timing attacks
  if (token.length !== secret.length) return false;

  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Compute a SHA-256 hash for idempotency deduplication of webhook events.
 * Combines notarization_id + bn_session_id + event_type + message.
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
