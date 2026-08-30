import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { canTransitionReview, REVIEW_STATUSES, type ReviewStatus } from '@/lib/review/reviewWorkflow';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireDashboardAccess();
    const { id } = await context.params;
    const body = await request.json() as { status?: string; operator_response?: string };
    if (!REVIEW_STATUSES.includes(body.status as ReviewStatus)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const admin = createAdminClient();
    const { data: current } = await admin.from('review_requests').select('id, status').eq('id', id).single();
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
    return NextResponse.json({ success: true, review: data });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
