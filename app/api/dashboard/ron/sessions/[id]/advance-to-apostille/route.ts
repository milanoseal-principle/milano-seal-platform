import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { assertCanAdvanceToApostille, RONGuardError } from '@/lib/bluenotary/guards';

export const runtime = 'nodejs';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const { id: sessionId } = await params;
    const supabase = createAdminClient();

    const { data: session, error: sessionError } = await supabase
      .from('ron_sessions')
      .select('id, matter_id, milano_ron_status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ ok: false, code: 'SESSION_NOT_FOUND' }, { status: 404 });
    }

    await assertCanAdvanceToApostille(supabase, session.matter_id, sessionId);

    const { data: matter, error: matterError } = await supabase
      .from('deals')
      .select('id, deal_id, status, deal_status')
      .eq('id', session.matter_id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ ok: false, code: 'MATTER_NOT_FOUND' }, { status: 404 });
    }

    const current = String(matter.deal_status ?? matter.status ?? '');
    if (current === 'apostille_processing' && session.milano_ron_status === 'READY_FOR_APOSTILLE') {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        matter_status: 'apostille_processing',
        ron_status: 'READY_FOR_APOSTILLE',
      });
    }

    if (current !== 'in_execution') {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_STATE_TRANSITION',
          current_status: current || null,
          requested_status: 'apostille_processing',
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    let matterUpdate = supabase
      .from('deals')
      .update({
        status: 'apostille_processing',
        deal_status: 'apostille_processing',
        apostille_at: now,
        last_activity: now,
      })
      .eq('id', matter.id)
      .eq('status', matter.status);

    matterUpdate = matter.deal_status == null
      ? matterUpdate.is('deal_status', null)
      : matterUpdate.eq('deal_status', matter.deal_status);

    const { data: advancedMatter, error: advanceError } = await matterUpdate
      .select('id')
      .maybeSingle();

    if (advanceError || !advancedMatter) {
      return NextResponse.json(
        {
          ok: false,
          code: 'STALE_MATTER_STATE',
          message: 'Matter state changed before Apostille QA approval completed. Refresh and retry.',
        },
        { status: 409 }
      );
    }

    const { error: ronError } = await supabase
      .from('ron_sessions')
      .update({ milano_ron_status: 'READY_FOR_APOSTILLE', updated_at: now })
      .eq('id', sessionId)
      .eq('milano_ron_status', session.milano_ron_status);

    if (ronError) {
      console.error('[RON advance-to-apostille] session status update failed', ronError.message);
      return NextResponse.json(
        {
          ok: false,
          code: 'RON_STATUS_UPDATE_FAILED',
          message: 'Matter advanced but RON projection did not update. Operator review required.',
        },
        { status: 500 }
      );
    }

    await supabase.from('ron_audit_events').insert({
      matter_id: session.matter_id,
      ron_session_id: sessionId,
      event_type: 'RON_APOSTILLE_QA_APPROVED',
      description: 'Signed RON documents approved for governed Apostille processing.',
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: {
        previous_matter_status: current,
        matter_status: 'apostille_processing',
        ron_status: 'READY_FOR_APOSTILLE',
      },
    });

    return NextResponse.json({
      ok: true,
      matter_status: 'apostille_processing',
      ron_status: 'READY_FOR_APOSTILLE',
      next_action: 'APOSTILLE_PROCESSING',
    });
  } catch (error) {
    if (error instanceof RONGuardError) {
      return NextResponse.json(
        { ok: false, code: error.code, error: error.message },
        { status: error.code === 'MATTER_NOT_FOUND' || error.code === 'SESSION_NOT_FOUND' ? 404 : 409 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Unauthorized') || message.includes('access_denied')) {
      return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
    }
    console.error('[RON advance-to-apostille]', message);
    return NextResponse.json({ ok: false, code: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
