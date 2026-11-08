import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { ronRouteError } from '@/lib/ron/evidenceServer';

export const runtime = 'nodejs';
const UUID = /^[0-9a-f-]{36}$/i;
const CATEGORIES = ['JOURNAL_ENTRY', 'AV_RECORDING', 'EXECUTED_DOCUMENT', 'SESSION_EVIDENCE'];

// GET /api/dashboard/ron/records-requests?matter_id=… — operator-only, always Matter-scoped (no signer search).
export async function GET(request: NextRequest) {
  try {
    await requireDashboardAccess();
    const matterId = request.nextUrl.searchParams.get('matter_id') ?? '';
    if (!UUID.test(matterId)) return NextResponse.json({ ok: false, code: 'MATTER_ID_REQUIRED' }, { status: 422 });
    const supabase = createAdminClient();
    const { data } = await supabase.from('ron_records_requests').select('*').eq('matter_id', matterId).order('received_at', { ascending: false }).limit(200);
    return NextResponse.json({ ok: true, requests: data ?? [] });
  } catch (error) {
    const failure = ronRouteError(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}

// POST /api/dashboard/ron/records-requests — governed intake recorded by an operator.
export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const matterId = String(body.matter_id ?? '');
    const sessionId = String(body.ron_session_id ?? '');
    const requesterName = typeof body.requester_name === 'string' ? body.requester_name.trim() : '';
    const basis = typeof body.request_basis === 'string' ? body.request_basis.trim() : '';
    const category = String(body.record_category ?? '');
    if (!UUID.test(matterId) || !UUID.test(sessionId) || !requesterName || !basis || !CATEGORIES.includes(category)) {
      return NextResponse.json({ ok: false, code: 'INVALID_RECORDS_REQUEST' }, { status: 422 });
    }
    const supabase = createAdminClient();
    const { data: session } = await supabase.from('ron_sessions').select('id').eq('id', sessionId).eq('matter_id', matterId).maybeSingle();
    if (!session) return NextResponse.json({ ok: false, code: 'RON_RECORDS_REQUEST_CROSS_MATTER' }, { status: 404 });
    const dueAt = typeof body.due_at === 'string' && !Number.isNaN(Date.parse(body.due_at)) ? new Date(body.due_at).toISOString() : null;
    const { data, error } = await supabase.from('ron_records_requests').insert({
      matter_id: matterId,
      ron_session_id: sessionId,
      requester_name: requesterName.slice(0, 200),
      requester_email: typeof body.requester_email === 'string' ? body.requester_email.trim().slice(0, 320) : null,
      record_category: category,
      request_basis: basis.slice(0, 2000),
      due_at: dueAt,
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 2000) : null,
      created_by: userId,
    }).select('id').single();
    if (error) return NextResponse.json({ ok: false, code: error.message }, { status: 409 });
    await supabase.from('ron_records_request_events').insert({
      request_id: data.id, matter_id: matterId, event_type: 'RECORDS_REQUEST_RECEIVED', actor_id: userId, actor_role: role,
      metadata: { record_category: category, due_at: dueAt },
    });
    return NextResponse.json({ ok: true, request_id: data.id }, { status: 201 });
  } catch (error) {
    const failure = ronRouteError(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}
