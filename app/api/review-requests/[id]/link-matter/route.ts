import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireDashboardAccess();
    const { id } = await context.params;
    const body = await request.json() as { matter_id?: string };
    const matterId = String(body.matter_id ?? '').trim();
    if (!matterId) return NextResponse.json({ error: 'matter_id is required' }, { status: 400 });

    const admin = createAdminClient();
    const [{ data: review }, { data: matter }] = await Promise.all([
      admin.from('review_requests').select('id, matter_id, status').eq('id', id).single(),
      admin.from('deals').select('id').eq('id', matterId).single(),
    ]);
    if (!review) return NextResponse.json({ error: 'Review request not found' }, { status: 404 });
    if (!matter) return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    if (review.matter_id && review.matter_id !== matterId) return NextResponse.json({ error: 'REVIEW_ALREADY_LINKED' }, { status: 409 });
    if (review.matter_id === matterId) return NextResponse.json({ success: true, review });

    const { data, error } = await admin.from('review_requests').update({ matter_id: matterId, updated_at: new Date().toISOString() })
      .eq('id', id).is('matter_id', null).select('id, matter_id, status').single();
    if (error || !data) return NextResponse.json({ error: 'REVIEW_LINK_CONFLICT' }, { status: 409 });

    const { error: eventError } = await admin.from('review_request_events').insert({
      review_request_id: id,
      matter_id: matterId,
      event_type: 'REVIEW_MATTER_LINKED',
      from_status: review.status,
      to_status: review.status,
      actor_user_id: userId,
      metadata: { action: 'MATTER_LINKED', matter_lifecycle_changed: false },
    });
    if (eventError) return NextResponse.json({ error: 'REVIEW_EVENT_PERSIST_FAILED' }, { status: 500 });

    return NextResponse.json({ success: true, review: data });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
