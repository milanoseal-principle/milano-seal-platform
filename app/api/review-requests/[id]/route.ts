import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { canTransitionReview, REVIEW_STATUSES, type ReviewStatus } from '@/lib/review/reviewWorkflow';
import { sendReviewResolvedNotification } from '@/lib/review/reviewNotifications';

const EVENT_BY_STATUS: Record<Exclude<ReviewStatus, 'REQUESTED'>, string> = {
  ACKNOWLEDGED: 'REVIEW_ACKNOWLEDGED',
  IN_REVIEW: 'REVIEW_STARTED',
  RESOLVED: 'REVIEW_RESOLVED',
  CLOSED: 'REVIEW_CLOSED',
};

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireDashboardAccess();
    const { id } = await context.params;
    const body = await request.json() as { status?: string; operator_response?: string };
    if (!REVIEW_STATUSES.includes(body.status as ReviewStatus)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const admin = createAdminClient();
    const { data: current } = await admin.from('review_requests').select('id, matter_id, status').eq('id', id).single();
    if (!current) return NextResponse.json({ error: 'Review request not found' }, { status: 404 });
    const from = current.status as ReviewStatus;
    const to = body.status as ReviewStatus;
    if (!canTransitionReview(from, to)) return NextResponse.json({ error: `Invalid review transition ${from} -> ${to}` }, { status: 409 });

    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      status: to,
      assigned_operator_id: userId,
      updated_at: now,
    };
    if (to === 'ACKNOWLEDGED') update.acknowledged_at = now;
    if (to === 'RESOLVED') {
      update.resolved_at = now;
      update.operator_response = String(body.operator_response ?? '').trim() || null;
    }
    if (to === 'IN_REVIEW' && body.operator_response) update.operator_response = String(body.operator_response).trim();

    const { data, error } = await admin.from('review_requests').update(update).eq('id', id).eq('status', from).select('*').single();
    if (error || !data) return NextResponse.json({ error: 'Review request changed concurrently' }, { status: 409 });

    if (to !== 'REQUESTED') {
      const { error: eventError } = await admin.from('review_request_events').insert({
        review_request_id: id,
        matter_id: current.matter_id,
        event_type: EVENT_BY_STATUS[to],
        from_status: from,
        to_status: to,
        actor_user_id: userId,
        metadata: body.operator_response ? { operator_response_recorded: true } : {},
      });
      if (eventError) return NextResponse.json({ error: 'REVIEW_EVENT_PERSIST_FAILED' }, { status: 500 });
    }

    if (to === 'RESOLVED' && current.matter_id) {
      const { data: matter } = await admin.from('deals').select('id, email').eq('id', current.matter_id).single();
      if (matter?.email) {
        await sendReviewResolvedNotification({ reviewId: id, matterId: matter.id, clientEmail: matter.email });
      }
    }

    return NextResponse.json({ success: true, review: data });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
