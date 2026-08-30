import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  REVIEW_BODY_LIMIT_BYTES,
  REVIEW_DUPLICATE_MINUTES,
  REVIEW_IP_DAILY_LIMIT,
  REVIEW_SESSION_LIMIT,
  REVIEW_WINDOW_MINUTES,
  clientIp,
  isObviousReviewSpam,
  parseReviewSubmission,
  reviewFingerprint,
  reviewOperationalHash,
} from "@/lib/review/reviewAbuseGuard";
import { queueOperatorReviewNotification } from "@/lib/review/reviewNotifications";
import { normalizeUserRole } from "@/lib/auth/roleRedirect";
import { resolveServerRole } from "@/lib/auth/server-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(code: string, status: number) {
  return NextResponse.json({ ok: false, code }, { status });
}

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > REVIEW_BODY_LIMIT_BYTES) return jsonError("REVIEW_REQUEST_TOO_LARGE", 413);
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > REVIEW_BODY_LIMIT_BYTES) return jsonError("REVIEW_REQUEST_TOO_LARGE", 413);

  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return jsonError("REVIEW_REQUEST_INVALID", 400); }
  const submission = parseReviewSubmission(parsed);
  if (!submission) return jsonError("REVIEW_REQUEST_INVALID", 400);
  if (isObviousReviewSpam(submission)) return jsonError("REVIEW_REQUEST_REJECTED", 400);

  const hashSecret = process.env.REVIEW_ABUSE_HASH_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hashSecret) return jsonError("REVIEW_GUARD_UNCONFIGURED", 503);
  const ipHash = reviewOperationalHash(clientIp(request), hashSecret);
  const fingerprint = reviewFingerprint(submission, hashSecret);
  const admin = createAdminClient();
  const now = Date.now();

  const duplicateSince = new Date(now - REVIEW_DUPLICATE_MINUTES * 60_000).toISOString();
  const { data: duplicate, error: duplicateError } = await admin.from("review_requests").select("id,status,created_at").eq("request_fingerprint", fingerprint).gte("created_at", duplicateSince).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (duplicateError) return jsonError("REVIEW_GUARD_UNAVAILABLE", 503);
  if (duplicate) return NextResponse.json({ ok: true, duplicate: true, review_request: duplicate });

  const sessionSince = new Date(now - REVIEW_WINDOW_MINUTES * 60_000).toISOString();
  const daySince = new Date(now - 24 * 60 * 60_000).toISOString();
  const [sessionResult, ipResult] = await Promise.all([
    admin.from("review_requests").select("id", { count: "exact", head: true }).eq("session_reference", submission.session_reference).gte("created_at", sessionSince),
    admin.from("review_requests").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", daySince),
  ]);
  if (sessionResult.error || ipResult.error) return jsonError("REVIEW_GUARD_UNAVAILABLE", 503);
  const sessionCount = sessionResult.count;
  const ipCount = ipResult.count;
  if ((sessionCount ?? 0) >= REVIEW_SESSION_LIMIT || (ipCount ?? 0) >= REVIEW_IP_DAILY_LIMIT) return jsonError("REVIEW_RATE_LIMITED", 429);

  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  let matterId: string | null = null;
  if (submission.matter_id) {
    if (!user?.email) return jsonError("REVIEW_MATTER_FORBIDDEN", 403);
    const { data: owned } = await admin.from("deals").select("id").eq("id", submission.matter_id).ilike("email", user.email.trim()).maybeSingle();
    if (!owned) return jsonError("REVIEW_MATTER_FORBIDDEN", 403);
    matterId = owned.id as string;
  }

  const { data, error } = await admin.from("review_requests").insert({
    matter_id: matterId,
    session_reference: submission.session_reference,
    country: submission.country ?? null,
    document_type: submission.document_type ?? null,
    question: submission.question,
    safe_context: submission.safe_context,
    status: "REQUESTED",
    requested_by: user?.id ?? null,
    ip_hash: ipHash,
    request_fingerprint: fingerprint,
  }).select("id,status,created_at,matter_id").single();
  if (error || !data) return jsonError("REVIEW_REQUEST_FAILED", 500);
  await queueOperatorReviewNotification(data.id as string, (data.matter_id as string | null) ?? null);
  return NextResponse.json({ ok: true, duplicate: false, review_request: data }, { status: 201 });
}

export async function GET() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return jsonError("UNAUTHORIZED", 401);
  const role = normalizeUserRole(await resolveServerRole(user));
  if (!role || !["operator", "admin", "owner"].includes(role)) return jsonError("FORBIDDEN", 403);
  const admin = createAdminClient();
  const { data, error } = await admin.from("review_requests").select("id,matter_id,session_reference,country,document_type,question,safe_context,status,created_at,updated_at,operator_user_id").order("created_at", { ascending: false }).limit(100);
  if (error) return jsonError("REVIEW_REQUESTS_UNAVAILABLE", 500);
  return NextResponse.json({ ok: true, review_requests: data ?? [] });
}
