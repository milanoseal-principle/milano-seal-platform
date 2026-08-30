import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAllClientDeals } from '@/lib/portalAuth';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { clientReviewLabel, normalizeReviewInput } from '@/lib/review/reviewWorkflow';

export async function POST(request: NextRequest) {
  try {
    const body = normalizeReviewInput(await request.json() as Record<string, unknown>);
    const server = await createServerClient();
    const { data: { user } } = await server.auth.getUser();
    const clientCtx = user ? await getAllClientDeals() : null;

    let matterId: string | null = null;
    if (body.matter_id && clientCtx?.deals.some((deal) => deal.id === body.matter_id)) matterId = body.matter_id;
    if (!user && !body.session_reference) {
      return NextResponse.json({ error: 'session_reference is required for an unauthenticated review request' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.from('review_requests').insert({
      ...body,
      matter_id: matterId,
      requester_user_id: user?.id ?? null,
      status: 'REQUESTED',
    }).select('id, matter_id, status, created_at').single();

    if (error || !data) return NextResponse.json({ error: 'Unable to persist review request' }, { status: 500 });
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
