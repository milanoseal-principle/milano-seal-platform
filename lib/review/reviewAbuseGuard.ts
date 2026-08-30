import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

const SAFE_CONTEXT_KEYS = new Set(['pathname','label','destination_country','destination_slug','document_type','origin','signer_posture','route_status','matter_status','current_step']);
const SESSION_WINDOW_MINUTES = 15;
const IP_WINDOW_HOURS = 24;
const DUPLICATE_WINDOW_MINUTES = 10;
const MAX_SESSION_REQUESTS = 3;
const MAX_IP_REQUESTS = 10;

export type ReviewGuardResult =
  | { ok: true; duplicateId?: string; safeContext: Record<string, unknown>; ipHash: string; fingerprint: string }
  | { ok: false; code: 'REVIEW_RATE_LIMITED' | 'REVIEW_SPAM_REJECTED' | 'REVIEW_GUARD_UNAVAILABLE'; status: 429 | 503 };

function normalized(value: unknown, max = 500) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function digest(value: string) {
  const secret = process.env.REVIEW_ABUSE_HMAC_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('REVIEW_GUARD_SECRET_UNAVAILABLE');
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

export function sanitizeSafeContext(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of SAFE_CONTEXT_KEYS) {
    const v = source[key];
    if (typeof v === 'string') out[key] = normalized(v, 500);
    else if (typeof v === 'number' || typeof v === 'boolean' || v === null) out[key] = v;
  }
  return out;
}

export function reviewFingerprint(input: { session_reference?: string | null; country?: string | null; document_type?: string | null; question: string }) {
  return digest([
    normalized(input.session_reference, 160).toLowerCase(),
    normalized(input.country, 200).toLowerCase(),
    normalized(input.document_type, 200).toLowerCase(),
    normalized(input.question, 4000).toLowerCase(),
  ].join('|'));
}

export function extractClientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || 'unknown';
}

export function obviousReviewSpam(input: Record<string, unknown>) {
  const honeypot = normalized(input.website || input.company_website || input.fax_number, 200);
  if (honeypot) return true;
  const question = normalized(input.question, 4000).toLowerCase();
  if (!question) return true;
  const links = (question.match(/https?:\/\//g) || []).length;
  return links > 3 || /(buy followers|casino bonus|crypto giveaway|seo backlinks|viagra|loan offer)/i.test(question);
}

export async function enforceReviewAbuseGuard(
  admin: SupabaseClient,
  input: Record<string, unknown>,
  headers: Headers,
): Promise<ReviewGuardResult> {
  try {
    if (obviousReviewSpam(input)) return { ok: false, code: 'REVIEW_SPAM_REJECTED', status: 429 };
    const sessionReference = normalized(input.session_reference, 160) || null;
    const ipHash = digest(extractClientIp(headers));
    const fingerprint = reviewFingerprint({
      session_reference: sessionReference,
      country: normalized(input.country, 200) || null,
      document_type: normalized(input.document_type, 200) || null,
      question: normalized(input.question, 4000),
    });
    const now = Date.now();
    const sessionSince = new Date(now - SESSION_WINDOW_MINUTES * 60_000).toISOString();
    const ipSince = new Date(now - IP_WINDOW_HOURS * 60 * 60_000).toISOString();
    const duplicateSince = new Date(now - DUPLICATE_WINDOW_MINUTES * 60_000).toISOString();

    if (sessionReference) {
      const { count, error } = await admin.from('review_requests').select('id', { count: 'exact', head: true })
        .eq('session_reference', sessionReference).gte('created_at', sessionSince);
      if (error) throw error;
      if ((count ?? 0) >= MAX_SESSION_REQUESTS) return { ok: false, code: 'REVIEW_RATE_LIMITED', status: 429 };
    }

    const { count: ipCount, error: ipError } = await admin.from('review_requests').select('id', { count: 'exact', head: true })
      .eq('request_ip_hash', ipHash).gte('created_at', ipSince);
    if (ipError) throw ipError;
    if ((ipCount ?? 0) >= MAX_IP_REQUESTS) return { ok: false, code: 'REVIEW_RATE_LIMITED', status: 429 };

    const { data: duplicate, error: dupError } = await admin.from('review_requests').select('id')
      .eq('request_fingerprint', fingerprint).gte('created_at', duplicateSince).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (dupError) throw dupError;

    return { ok: true, duplicateId: duplicate?.id, safeContext: sanitizeSafeContext(input.safe_context), ipHash, fingerprint };
  } catch {
    return { ok: false, code: 'REVIEW_GUARD_UNAVAILABLE', status: 503 };
  }
}
