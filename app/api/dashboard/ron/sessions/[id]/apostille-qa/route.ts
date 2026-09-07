import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { assertCanAdvanceToApostille, RONGuardError } from '@/lib/bluenotary/guards';
import { normalizeExecutionTruth, validateExecutionTruth } from '@/lib/matter/executionTruth';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const { id: sessionId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

    if (!reason) {
      return NextResponse.json(
        { ok: false, code: 'APOSTILLE_QA_REASON_REQUIRED' },
        { status: 422 }
      );
    }

    const admin = createAdminClient();
    const { data: session, error: sessionError } = await admin
      .from('ron_sessions')
      .select('id, matter_id, milano_ron_status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ ok: false, code: 'SESSION_NOT_FOUND' }, { status: 404 });
    }

    const { data: matter, error: matterError } = await admin
      .from('deals')
      .select('id, deal_id, status, deal_status, execution_truth')
      .eq('id', session.matter_id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ ok: false, code: 'MATTER_NOT_FOUND' }, { status: 404 });
    }

    const current = String(matter.deal_status ?? matter.status ?? '');
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

    const truth = normalizeExecutionTruth(
      (matter.execution_truth ?? {}) as Record<string, unknown>
    );
    const validation = validateExecutionTruth(truth);
    if (!validation.valid || validation.reviewRequired) {
      return NextResponse.json(
        {
          ok: false,
          code: 'EXECUTION_REVIEW_REQUIRED',
          remaining: validation.errors,
        },
        { status: 409 }
      );
    }

    await assertCanAdvanceToApostille(admin, matter.id, session.id);

    const now = new Date().toISOString();
    let update = admin
      .from('deals')
      .update({
        status: 'apostille_processing',
        deal_status: 'apostille_processing',
        apostille_at: now,
        last_activity: now,
      })
      .eq('id', matter.id)
      .eq('status', matter.status);

    update = matter.deal_status == null
      ? update.is('deal_status', null)
      : update.eq('deal_status', matter.deal_status);

    const { data: advanced, error: advanceError } = await update
      .select('id, deal_id')
      .maybeSingle();

    if (advanceError || !advanced) {
      return NextResponse.json(
        { ok: false, code: 'STALE_MATTER_STATE' },
        { status: 409 }
      );
    }

    await admin
      .from('ron_sessions')
      .update({
        milano_ron_status: 'READY_FOR_APOSTILLE',
        updated_at: now,
      })
      .eq('id', session.id)
      .in('milano_ron_status', ['SIGNED_DOCS_RETRIEVED', 'READY_FOR_APOSTILLE']);

    await admin.from('ron_audit_events').insert({
      matter_id: matter.id,
      ron_session_id: session.id,
      event_type: 'APOSTILLE_QA_APPROVED',
      description: `Operator approved Apostille QA and advanced Matter to apostille_processing. Reason: ${reason}`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: {
        previous_state: 'in_execution',
        new_state: 'apostille_processing',
        reason,
        approved_at: now,
      },
    });

    return NextResponse.json({
      ok: true,
      matter_id: advanced.id,
      deal_id: advanced.deal_id,
      status: 'apostille_processing',
      ron_status: 'READY_FOR_APOSTILLE',
    });
  } catch (error) {
    if (error instanceof RONGuardError) {
      return NextResponse.json(
        { ok: false, code: error.code, error: error.message },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('Unauthorized') || message.includes('access_denied')) {
      return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
    }

    console.error('[RON apostille QA]', message);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}
