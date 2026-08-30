import { createHmac } from "node:crypto";

export const REVIEW_WINDOW_MINUTES = 15;
export const REVIEW_SESSION_LIMIT = 3;
export const REVIEW_IP_DAILY_LIMIT = 10;
export const REVIEW_DUPLICATE_MINUTES = 10;
export const REVIEW_BODY_LIMIT_BYTES = 16_384;

const SAFE_CONTEXT_KEYS = new Set([
  "source_route",
  "language",
  "intent",
  "pillar",
  "origin_state",
  "receiving_authority_type",
]);

const SENSITIVE_KEY = /(password|credential|passport|kba|token|secret|signed.?url|document|file|bytes|base64|authorization|cookie)/i;

export interface ReviewSubmission {
  session_reference: string;
  country?: string;
  document_type?: string;
  question: string;
  matter_id?: string;
  safe_context: Record<string, string>;
  website?: string;
}

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

export function sanitizeSafeContext(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const safe: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!SAFE_CONTEXT_KEYS.has(key) || SENSITIVE_KEY.test(key)) continue;
    const clean = normalizeText(raw, 160);
    if (clean && !/https?:\/\//i.test(clean)) safe[key] = clean;
  }
  return safe;
}

export function parseReviewSubmission(value: unknown): ReviewSubmission | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const session_reference = normalizeText(body.session_reference, 128);
  const question = normalizeText(body.question, 2_000);
  if (!session_reference || session_reference.length < 8 || !question || question.length < 12) return null;

  return {
    session_reference,
    question,
    country: normalizeText(body.country, 80) || undefined,
    document_type: normalizeText(body.document_type, 120) || undefined,
    matter_id: normalizeText(body.matter_id, 128) || undefined,
    safe_context: sanitizeSafeContext(body.safe_context),
    website: normalizeText(body.website, 200) || undefined,
  };
}

export function isObviousReviewSpam(submission: ReviewSubmission): boolean {
  if (submission.website) return true;
  const links = submission.question.match(/https?:\/\/|www\./gi)?.length ?? 0;
  if (links > 1) return true;
  if (/(.)\1{12,}/i.test(submission.question)) return true;
  return /\b(crypto giveaway|casino bonus|seo backlinks|guest post offer)\b/i.test(submission.question);
}

export function normalizeReviewQuestion(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function reviewOperationalHash(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function reviewFingerprint(submission: ReviewSubmission, secret: string): string {
  return reviewOperationalHash(
    [submission.session_reference, submission.country ?? "", submission.document_type ?? "", normalizeReviewQuestion(submission.question)].join("|"),
    secret,
  );
}

export function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown").trim();
}
