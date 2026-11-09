import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { appendMatterEvidence } from '@/lib/matter/evidenceLedger';
import {
  buildRonEvidenceCommand,
  isValidRonLifecycleTransition,
  type RonLifecycleState,
} from '@/lib/ron/evidence';
import { loadRonEvidence, ronRouteError } from '@/lib/ron/evidenceServer';

export const runtime = 'nodejs';

const ACTIONS = ['verify', 'complete', 'reopen', 'fail'] as const;
type Action = (typeof ACTIONS)[number];
const TARGET: Record<Action, RonLifecycleState> = {
  verify: 'EVIDENCE_VERIFIED',
  complete: 'COMPLETED',
  reopen: 'EVIDENCE_PENDING',
  fail: 'FAILED',
};

// POST /api/dashboard/ron/sessions/[id]/evidence/verify
// Milano-only lifecycle authority: verify evidence, complete, reopen, or fail.
// There is no path that completes a session with missing mandatory evidence.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { action?: unknown; reason?: unknown };
    const action = ACTIONS.find((a) => a === body.action);
    if (!action) return NextResponse.json({ ok: false, code: 'INVALID_ACTION', allowed: ACTIONS }, { status: 422 });
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
    if ((action === 'reopen' || action === 'fail') && !reason) {
      return NextResponse.json({ ok: false, code: 'REASON_REQUIRED' }, { status: 422 });
    }

    const supabase = createAdminClient();
    const loaded = await loadRonEvidence(supabase, id);
    if (!loaded) return NextResponse.json({ ok: false, code: 'SESSION_NOT_FOUND' }, { status: 404 });
    const { session, lifecycle, input } = loaded;
    const target = TARGET[action];

    if (lifecycle === target) return NextResponse.json({ ok: true, duplicate: true, lifecycle });
    if (!isValidRonLifecycleTransition(lifecycle, target)) {
      return NextResponse.json({ ok: false, code: 'INVALID_RON_LIFECYCLE_TRANSITION', lifecycle, requested: target }, { status: 409 });
    }

    const now = new Date().toISOString();
    const update: Record<string, unknown> = { ron_lifecycle_state: target, updated_at: now };

    if (action === 'verify' || action === 'complete') {
      const command = buildRonEvidenceCommand(input, action, userId, now);
      if (command.missing.length > 0) return NextResponse.json({ ok: false, code: 'RON_EVIDENCE_INCOMPLETE', missing: command.missing }, { status: 409 });
      Object.assign(update, command.update);
    }

    if (action === 'fail') {
      update.exception_status = 'open';
      update.exception_reason = reason;
      update.session_url_status = 'BLOCKED';
    }

    const { data: updated, error } = await supabase
      .from('ron_sessions')
      .update(update)
      .eq('id', id)
      .eq('ron_lifecycle_state', lifecycle)
      .select('id, ron_lifecycle_state')
      .maybeSingle();
    if (error) {
      // Database fail-closed enforcement rejected the transition.
      return NextResponse.json(
        { ok: false, code: error.message || 'RON_LIFECYCLE_REJECTED', missing: error.details ? String(error.details).split(',') : [] },
        { status: 409 }
      );
    }
    if (!updated) return NextResponse.json({ ok: false, code: 'STALE_RON_SESSION', message: 'Session changed. Refresh and retry.' }, { status: 409 });

    const eventType = {
      verify: 'RON_EVIDENCE_VERIFIED',
      complete: 'RON_MILANO_COMPLETED',
      reopen: 'RON_EVIDENCE_REOPENED',
      fail: 'RON_SESSION_FAILED',
    }[action];
    await supabase.from('ron_audit_events').insert({
      matter_id: session.matter_id,
      ron_session_id: id,
      event_type: eventType,
      description: `RON lifecycle ${lifecycle} → ${target} by ${role}.${reason ? ` Reason: ${reason}` : ''}`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: {
        previous_lifecycle: lifecycle,
        ron_lifecycle_state: target,
        reason: reason || null,
        evidence_verification_hash: update.evidence_verification_hash ?? null,
        retention_rule: update.retention_rule ?? null,
      },
    });
    await appendMatterEvidence({
      matterId: session.matter_id,
      eventType,
      domain: 'ron',
      actorType: 'operator',
      actorId: userId,
      source: 'dashboard_ron_lifecycle',
      sourceReference: id,
      priorValue: { ron_lifecycle_state: lifecycle },
      newValue: { ron_lifecycle_state: target },
      reason: reason || null,
      correlationId: `ron_lifecycle:${id}:${target}`,
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, lifecycle: target, event_type: eventType });
  } catch (error) {
    const failure = ronRouteError(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}
