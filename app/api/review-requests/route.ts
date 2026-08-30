import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAllClientDeals } from '@/lib/portalAuth';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { clientReviewLabel, normalizeReviewInput, type ReviewStatus } from '@/lib/review/reviewWorkflow';
import { enforceReviewAbuseGuard } from '@/lib/review/reviewAbuseGuard';
import { sendReviewRequestedNotification } from '@/lib/review/reviewNotifications';

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? '0');
    if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: 'REVIEW_REQUEST_TOO_LARGE' }, { status: 413 });

    const rawText = await request.text();
    if (Buffer.byteLength(rawText, 'utf8') > MAX_BODY_BYTES) return NextResponse.json({ error: 'REVIEW_REQUEST_TOO_LARGE' }, { status: 413 });
    const raw = JSON.parse(rawText || '{}') as Record<string, unknown>;

    const server = await createServerClient();
    const { data: { user } } = await server.auth.getUser();
    const clientCtx = user ? await getAllClientDeals() : null;
    const admin = createAdminClient();

    const guard = await enforceReviewAbuseGuard(admin, raw, request.headers);
    if (!guard.ok) return NextResponse.json({ error: guard.code }, { status: guard.status });

    const body = normalizeReviewInput({ ...raw, safe_context: guard.safeContext });
    let matterId: string | null = null;
    if (body.matter_id && clientCtx?.deals.some((deal) => deal.id === body.matter_id)) matterId = body.matter_id;
    if (body.matter_id && !matterId) return NextResponse.json({ error: 'MATTER_ATTACHMENT_NOT_AUTHORIZED' }, { status: 403 });
    if (!user && !body.session_reference) {
      return NextResponse.json({ error: 'session_reference is required for an unauthenticated review request' }, { status: 400 });
    }

    if (guard.duplicateId) {
      const { data: duplicate } = await admin.from('review_requests')
        .select('id, matter_id, status, created_at').eq('id', guard.duplicateId).single();
      if (duplicate) {
        return NextResponse.json({ success: true, duplicate: true, review: { ...duplicate, client_label: clientReviewLabel(duplicate.status as ReviewStatus) } }, { status: 200 });
      }
    }

    const { data, error } = await admin.from('review_requests').insert({
      ...body,
      safe_context: guard.safeContext,
      matter_id: matterId,
      requester_user_id: user?.id ?? null,
      request_ip_hash: guard.ipHash,
      request_fingerprint: guard.fingerprint,
      status: 'REQUESTED',
    }).select('id, matter_id, status, created_at').single();

    if (error || !data) return NextResponse.json({ error: 'Unable to persist review request' }, { status: 500 });

    const { error: eventError } = await admin.from('review_request_events').insert({
      review_request_id: data.id,
      matter_id: data.matter_id,
      event_type: 'REVIEW_REQUESTED',
      from_status: null,
      to_status: 'REQUESTED',
      actor_user_id: user?.id ?? null,
      metadata: { source: user ? 'authenticated_client' : 'public_session' },
    });
    if (eventError) return NextResponse.json({ error: 'REVIEW_EVENT_PERSIST_FAILED' }, { status: 500 });

    await sendReviewRequestedNotification({
      reviewId: data.id,
      matterId: data.matter_id,
      country: body.country,
      documentType: body.document_type,
    });

    return NextResponse.json({
      success: true,
      review: { ...data, client_label: clientReviewLabel('REQUESTED') },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'INVALID_REVIEW_REQUEST';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await requireDashboardAccess();
    const admin = createAdminClient();
    const { data, error } = await admin.from('review_requests')
      .select('id, matter_id, requester_user_id, session_reference, country, document_type, origin, signer_posture, question, status, assigned_operator_id, operator_response, created_at, acknowledged_at, resolved_at, updated_at')
      .order('created_at', { ascending: false }).limit(250);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reviews: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
