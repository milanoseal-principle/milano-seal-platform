import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { rescheduleBlueNotarySession } from '@/lib/bluenotary/client';

// PUT /api/dashboard/ron/sessions/[id]/reschedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const { id: sessionId } = await params;
    const body = await request.json();
    const { session_timing, reason } = body as {
      session_timing: string;
      reason: string;
    };

    if (!session_timing) {
      return NextResponse.json({ error: 'session_timing (ISO 8601) is required' }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 });
    }

    // Validate ISO 8601
    const parsedTime = new Date(session_timing);
    if (isNaN(parsedTime.getTime())) {
      return NextResponse.json({ error: 'session_timing must be a valid ISO 8601 date' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: session } = await supabase
      .from('ron_sessions')
      .select('id, bn_session_id, milano_ron_status')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.milano_ron_status === 'RON_EXPIRED' || session.milano_ron_status === 'RON_COMPLETED') {
      return NextResponse.json(
        { error: `Cannot reschedule a session with status ${session.milano_ron_status}` },
        { status: 400 }
      );
    }

    if (session.bn_session_id) {
      await rescheduleBlueNotarySession(session.bn_session_id, session_timing);
    }

    await supabase
      .from('ron_sessions')
      .update({
        session_timing: session_timing,
        scheduled_at: session_timing,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    await supabase.from('ron_audit_events').insert({
      ron_session_id: sessionId,
      event_type: 'RON_SESSION_RESCHEDULED',
      description: `Session rescheduled to ${session_timing}. Reason: ${reason}`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: { session_timing, reason },
    });

    return NextResponse.json({ success: true, session_timing });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('Unauthorized') || message.includes('access_denied')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
