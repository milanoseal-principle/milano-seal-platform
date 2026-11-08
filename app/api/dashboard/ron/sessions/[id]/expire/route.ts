import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { expireBlueNotarySession } from '@/lib/bluenotary/client';

// PUT /api/dashboard/ron/sessions/[id]/expire
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const { id: sessionId } = await params;
    const body = await request.json();
    const { reason } = body as { reason: string };

    if (!reason) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: session } = await supabase
      .from('ron_sessions')
      .select('id, matter_id, bn_session_id, milano_ron_status, ron_lifecycle_state')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.milano_ron_status === 'RON_EXPIRED' || session.ron_lifecycle_state === 'CANCELLED' || session.ron_lifecycle_state === 'FAILED') {
      return NextResponse.json({ error: 'Session is already expired' }, { status: 400 });
    }
    if (session.ron_lifecycle_state === 'COMPLETED') {
      return NextResponse.json({ error: 'A Milano-completed RON session cannot be expired; its evidence is immutable.' }, { status: 409 });
    }

    if (session.bn_session_id) {
      await expireBlueNotarySession(session.bn_session_id).catch(() => {
        // BN may already be expired — continue to update local state
      });
    }

    const now = new Date().toISOString();

    const { error: expireError } = await supabase
      .from('ron_sessions')
      .update({
        milano_ron_status: 'RON_EXPIRED',
        ron_lifecycle_state: 'CANCELLED',
        session_url_status: 'BLOCKED',
        expired_at: now,
        updated_at: now,
      })
      .eq('id', sessionId)
      .neq('ron_lifecycle_state', 'COMPLETED');
    if (expireError) {
      return NextResponse.json({ error: 'Session could not be expired; state unchanged.' }, { status: 409 });
    }

    // Block all signing URL releases for this session
    await supabase
      .from('ron_signers')
      .update({ signing_url_released: false, updated_at: now })
      .eq('ron_session_id', sessionId);

    await supabase.from('ron_audit_events').insert({
      matter_id: session.matter_id,
      ron_session_id: sessionId,
      event_type: 'RON_SESSION_EXPIRED',
      description: `Session manually expired by ${role}. Reason: ${reason}`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: { reason, expired_at: now, previous_lifecycle: session.ron_lifecycle_state, ron_lifecycle_state: 'CANCELLED' },
    });

    return NextResponse.json({ success: true, status: 'RON_EXPIRED' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('Unauthorized') || message.includes('access_denied')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
