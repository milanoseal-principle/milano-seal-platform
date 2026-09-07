import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { assertCanAdvanceToApostille, RONGuardError } from '@/lib/bluenotary/guards';
import { validateExecutionTruth } from '@/lib/matter/executionTruth';

// POST /api/dashboard/ron/sessions/[id]/apostille-qa
// The sole RON-authoritative transition into Apostille processing.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const { id: sessionId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason) {
      return NextResponse.json({ error: 'APOSTILLE_QA_REASON_REQUIRED' }, { status: 422 });
    }

    const supabase = createAdminClient();
    const { data: session } = await supabase
      .from('ron_sessions')
      .select('id, matter_id, completed_at')
      .eq('id', sessionId)
      .maybeSingle();
    if (!session?.matter_id || !session.completed_at) {
      return NextResponse.json({ error: 'RON_COMPLETION_REQUIRED' }, { status: 409 });
    }

    await assertCanAdvanceToApostille(supabase, session.matter_id, sessionId);

    const { data: matter } = await supabase
      .from('deals')
      .select('id, status, deal_status, execution_truth')
      .eq('id', session.matter_id)
      .maybeSingle();
    if (!matter || matter.status !== 'in_execution') {
      return NextResponse.json({ error: 'INVALID_STATE_TRANSITION' }, { status: 409 });
    }

    const truth = matter.execution_truth;
    const validation = truth && typeof truth === 'object'
      ? validateExecutionTruth(truth)
      : { valid: false, reviewRequired: true, errors: ['EXECUTION_TRUTH_MISSING'] };
    if (!validation.valid || validation.reviewRequired) {
      return NextResponse.json({ error: 'EXECUTION_REVIEW_REQUIRED', remaining: validation.errors }, { status: 409 });
    }

    const now = new Date().toISOString();
    let update = supabase
      .from('deals')
      .update({ status: 'apostille_processing', deal_status: 'apostille_processing', apostille_at: now, last_activity: now })
      .eq('id', matter.id)
      .eq('status', 'in_execution');
    update = matter.deal_status == null
      ? update.is('deal_status', null)
      : update.eq('deal_status', matter.deal_status);
    const { data: advanced, error } = await update.select('id').maybeSingle();
    if (error || !advanced) {
      return NextResponse.json({ error: 'STALE_MATTER_STATE' }, { status: 409 });
    }

    await supabase.from('ron_sessions').update({ milano_ron_status: 'READY_FOR_APOSTILLE' }).eq('id', sessionId);
    await supabase.from('ron_audit_events').insert({
      matter_id: matter.id,
      ron_session_id: sessionId,
      event_type: 'RON_APOSTILLE_QA_APPROVED',
      description: reason,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: { previous_state: 'in_execution', new_state: 'apostille_processing', timestamp: now },
    });

    return NextResponse.json({ ok: true, status: 'apostille_processing' });
  } catch (error) {
    if (error instanceof RONGuardError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Unauthorized') || message.includes('access_denied')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
