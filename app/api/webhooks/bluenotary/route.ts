import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeEventHash } from '@/lib/bluenotary/webhook';
import { mapBNEventToMilanoStatus } from '@/lib/bluenotary/status';
import { getBlueNotarySignedDocuments } from '@/lib/bluenotary/client';
import { redactBNPayload } from '@/lib/bluenotary/redaction';
import { captureExecutedRonDocuments } from '@/lib/ron/executedCapture';
import { isRonLifecycleState, isTerminalRonLifecycle, providerEventLifecycle, type RonLifecycleState } from '@/lib/ron/evidence';
import { storeRONExecutedDocuments } from '@/lib/bluenotary/signedDocumentStorage';
import type { BNWebhookPayload } from '@/lib/bluenotary/types';

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

async function writeTransitionReview(
  supabase: ReturnType<typeof createAdminClient>,
  matterId: string,
  ronSessionId: string,
  providerEvent: string,
  currentStatus: string,
  reason: string
) {
  await supabase.from('ron_audit_events').insert({
    matter_id: matterId,
    ron_session_id: ronSessionId,
    event_type: 'MATTER_EXECUTION_TRANSITION_REVIEW_REQUIRED',
    description: `BlueNotary execution evidence could not advance the Matter automatically: ${reason}`,
    actor_role: 'system',
    source: 'bluenotary_webhook',
    metadata: {
      provider_event: providerEvent,
      current_matter_status: currentStatus || null,
      requested_matter_status: 'in_execution',
      reason,
    },
  });
}

async function advanceMatterIntoExecution(
  supabase: ReturnType<typeof createAdminClient>,
  matterId: string,
  ronSessionId: string,
  providerEvent: string
) {
  const { data: matter, error: matterError } = await supabase
    .from('deals')
    .select('id, deal_id, status, deal_status')
    .eq('id', matterId)
    .maybeSingle();

  if (matterError || !matter) {
    await writeTransitionReview(
      supabase,
      matterId,
      ronSessionId,
      providerEvent,
      '',
      'Matter record could not be loaded'
    );
    return;
  }

  const current = String(matter.deal_status ?? matter.status ?? '');
  if (current === 'in_execution') return;

  if (current !== 'scheduled') {
    await writeTransitionReview(
      supabase,
      matterId,
      ronSessionId,
      providerEvent,
      current,
      'Matter is not in the canonical scheduled state'
    );
    return;
  }

  const now = new Date().toISOString();
  let update = supabase
    .from('deals')
    .update({
      status: 'in_execution',
      deal_status: 'in_execution',
      execution_at: now,
      executed_at: now,
      last_activity: now,
    })
    .eq('id', matter.id)
    .eq('status', matter.status);

  update = matter.deal_status == null
    ? update.is('deal_status', null)
    : update.eq('deal_status', matter.deal_status);

  const { data: advanced, error } = await update.select('id').maybeSingle();
  if (error || !advanced) {
    await writeTransitionReview(
      supabase,
      matterId,
      ronSessionId,
      providerEvent,
      current,
      'Matter state changed before the provider transition completed'
    );
    return;
  }

  await supabase.from('ron_audit_events').insert({
    matter_id: matterId,
    ron_session_id: ronSessionId,
    event_type: 'MATTER_EXECUTION_STARTED_FROM_RON',
    description: 'Canonical Matter advanced from scheduled to in_execution from BlueNotary provider evidence.',
    actor_role: 'system',
    source: 'bluenotary_webhook',
    metadata: {
      provider_event: providerEvent,
      previous_matter_status: 'scheduled',
      matter_status: 'in_execution',
      execution_at: now,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.BLUENOTARY_WEBHOOK_SECRET) {
    console.error('[BN webhook] BLUENOTARY_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.BLUENOTARY_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: BNWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const eventHash = computeEventHash(payload);

  let ronSessionId: string | null = null;
  let matterId: string | null = null;
  let lifecycle: RonLifecycleState = 'REQUESTED';
  let milanoStatus: string | null = null;

  if (payload.notarization_id) {
    const { data: session } = await supabase
      .from('ron_sessions')
      .select('id, matter_id, ron_lifecycle_state, milano_ron_status')
      .eq('notarization_id', payload.notarization_id)
      .maybeSingle();

    if (session) {
      ronSessionId = session.id;
      matterId = session.matter_id;
      if (isRonLifecycleState(session.ron_lifecycle_state)) lifecycle = session.ron_lifecycle_state;
      milanoStatus = session.milano_ron_status ?? null;
    }
  }

  if (!ronSessionId && payload.bn_session_id) {
    const { data: session } = await supabase
      .from('ron_sessions')
      .select('id, matter_id, ron_lifecycle_state, milano_ron_status')
      .eq('bn_session_id', payload.bn_session_id)
      .maybeSingle();

    if (session) {
      ronSessionId = session.id;
      matterId = session.matter_id;
      if (isRonLifecycleState(session.ron_lifecycle_state)) lifecycle = session.ron_lifecycle_state;
      milanoStatus = session.milano_ron_status ?? null;
    }
  }

  const { error: eventInsertError } = await supabase.from('ron_webhook_events').insert({
    event_hash: eventHash,
    notarization_id: payload.notarization_id ?? null,
    bn_session_id: payload.bn_session_id ?? null,
    event_type: payload.event_type,
    event_message: payload.message ?? null,
    event_by_email: payload.event_by_email ?? null,
    event_by_name: payload.event_by_name ?? null,
    matter_id: matterId,
    ron_session_id: ronSessionId,
    processed: false,
    raw_payload: redactBNPayload(payload) as object,
    received_at: new Date().toISOString(),
  });

  if (eventInsertError) {
    if (eventInsertError.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    console.error(
      '[BN webhook] Failed to persist event',
      redactBNPayload({ error: eventInsertError.message, code: eventInsertError.code })
    );
    return NextResponse.json({ error: 'Webhook persistence failed' }, { status: 500 });
  }

  if (!ronSessionId) {
    console.warn('[BN webhook] Unknown session for event', {
      event_type: payload.event_type,
      notarization_id: payload.notarization_id,
    });
    return NextResponse.json({ ok: true, status: 'review_required' });
  }

  const newStatus = mapBNEventToMilanoStatus(payload.event_type);
  const sessionUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  // Provider events never regress or overwrite a Milano-governed terminal/verified projection.
  const projectionLocked =
    isTerminalRonLifecycle(lifecycle) ||
    lifecycle === 'EVIDENCE_VERIFIED' ||
    ['SIGNED_DOCS_RETRIEVED', 'READY_FOR_APOSTILLE', 'RON_COMPLETED'].includes(String(milanoStatus ?? ''));
  if (!projectionLocked) sessionUpdate.milano_ron_status = newStatus;
  const nextLifecycle = providerEventLifecycle(lifecycle, payload.event_type);
  if (nextLifecycle) {
    sessionUpdate.ron_lifecycle_state = nextLifecycle;
    lifecycle = nextLifecycle;
  }

  switch (payload.event_type) {
    case 'photo_id_passed':
      sessionUpdate.identity_status = 'PASSED';
      break;
    case 'photo_id_failed':
      sessionUpdate.identity_status = 'FAILED';
      break;
    case 'biometrics_passed':
      sessionUpdate.biometric_status = 'PASSED';
      break;
    case 'kba_started':
    case 'kba_answered':
      sessionUpdate.kba_status = 'IN_PROGRESS';
      break;
    case 'kba_succeeded':
      sessionUpdate.kba_status = 'PASSED';
      break;
    case 'kba_first_set_failed':
    case 'kba_failed':
      sessionUpdate.kba_status = 'FAILED';
      break;
    case 'open_call_accepted':
      if (nextLifecycle) sessionUpdate.provider_accepted_at = new Date().toISOString();
      break;
    case 'session_started':
      sessionUpdate.started_at = new Date().toISOString();
      break;
    case 'session_completed':
      // Provider completion is not Milano execution verification. P4 keeps the
      // session pending until executed-document/evidence verification is recorded.
      if (nextLifecycle) sessionUpdate.provider_session_completed_at = new Date().toISOString();
      sessionUpdate.provider_completed_at = new Date().toISOString();
      sessionUpdate.blue_notary_status = 'COMPLETED';
      break;
    case 'session_expired':
      if (nextLifecycle) {
        sessionUpdate.expired_at = new Date().toISOString();
        sessionUpdate.session_url_status = 'BLOCKED';
        sessionUpdate.exception_status = 'open';
        sessionUpdate.exception_reason = 'provider_session_expired';
      }
      break;
  }

  const { error: sessionUpdateError } = await supabase
    .from('ron_sessions')
    .update(sessionUpdate)
    .eq('id', ronSessionId);

  if (sessionUpdateError) {
    return NextResponse.json({ error: 'RON session update failed' }, { status: 500 });
  }

  if (matterId && payload.event_type === 'session_started') {
    await advanceMatterIntoExecution(supabase, matterId, ronSessionId, payload.event_type);
  }

  if (payload.signer_email || payload.event_by_email) {
    const signerEmail = (payload.signer_email ?? payload.event_by_email ?? '').toLowerCase();
    if (signerEmail) {
      const signerUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };

      switch (payload.event_type) {
        case 'join_session':
          signerUpdate.joined_at = new Date().toISOString();
          break;
        case 'leave_session':
          signerUpdate.left_at = new Date().toISOString();
          break;
        // Provider completion is retained as provider evidence, not statutory verification.
        case 'photo_id_passed':
          signerUpdate.identity_status = 'PASSED';
          break;
        case 'photo_id_failed':
          signerUpdate.identity_status = 'FAILED';
          break;
        case 'biometrics_passed':
          signerUpdate.biometric_status = 'PASSED';
          break;
        case 'kba_succeeded':
          signerUpdate.kba_status = 'PASSED';
          break;
        case 'kba_first_set_failed':
        case 'kba_failed':
          signerUpdate.kba_status = 'FAILED';
          break;
      }

      await supabase
        .from('ron_signers')
        .update(signerUpdate)
        .eq('ron_session_id', ronSessionId)
        .ilike('email', signerEmail);
    }
  }

  if (payload.event_type === 'session_completed') {
    await supabase.from('ron_audit_events').insert({
      matter_id: matterId,
      ron_session_id: ronSessionId,
      event_type: 'RON_PROVIDER_SESSION_COMPLETED',
      description: 'BlueNotary reported session completion; Milano verification remains pending until required execution evidence is secured.',
      actor_role: 'bluenotary',
      source: 'bluenotary_webhook',
      metadata: {
        provider_event: payload.event_type,
        provider_completion_is_authoritative: false,
      },
    });

    try {
      const { data: session } = await supabase
        .from('ron_sessions')
        .select('id, bn_session_id, matter_id, ron_lifecycle_state, milano_ron_status')
        .select('id, bn_session_id, matter_id')
        .eq('id', ronSessionId)
        .single();

      if (session?.bn_session_id) {
        const signedDocs = await getBlueNotarySignedDocuments(session.bn_session_id);
        const captured = await captureExecutedRonDocuments(supabase, session, signedDocs ?? [], {
          actorId: null,
          actorRole: 'system',
          source: 'bluenotary_webhook',
          providerEvent: payload.event_type,
        });

        const storedIds = await storeRONExecutedDocuments(supabase, session, signedDocs ?? []);

        await supabase
          .from('ron_sessions')
          .update({
            milano_ron_status: 'SESSION_PROCESSING',
            final_documents_status: 'AVAILABLE',
            updated_at: new Date().toISOString(),
          })
          .eq('id', ronSessionId);

        await supabase.from('ron_audit_events').insert({
          matter_id: matterId,
          ron_session_id: ronSessionId,
          event_type: 'RON_SIGNED_DOCUMENTS_RETRIEVED',
          description: 'Signed documents auto-retrieved via webhook. Next action: Milano statutory evidence verification',
          actor_role: 'system',
          source: 'bluenotary_webhook',
          metadata: {
            document_count: captured.length,
            captured: captured.filter((c) => c.decision === 'capture').length,
            duplicates: captured.filter((c) => c.decision === 'duplicate').length,
            conflicts: captured.filter((c) => c.decision === 'conflict').length,
          },
          description: 'Executed document versions secured; statutory evidence verification is required before execution completion.',
          actor_role: 'system',
          source: 'bluenotary_webhook',
          metadata: { document_count: storedIds.length },
        });
      }
    } catch (docErr) {
      console.error(
        '[BN webhook] Error retrieving signed docs',
        redactBNPayload({ error: docErr instanceof Error ? docErr.message : String(docErr) })
      );
    }
  }

  await supabase.from('ron_audit_events').insert({
    matter_id: matterId,
    ron_session_id: ronSessionId,
    event_type: `BN_${payload.event_type.toUpperCase()}`,
    description: `BlueNotary event: ${payload.event_type}${payload.message ? ` — ${payload.message}` : ''}`,
    actor_role: 'bluenotary',
    source: 'bluenotary_webhook',
    metadata: {
      bn_event_type: payload.event_type,
      mapped_status: newStatus,
      projection_locked: projectionLocked,
      ron_lifecycle_state: lifecycle,
      provider_event_is_authoritative_completion: false,
    },
  });

  await supabase
    .from('ron_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('event_hash', eventHash);

  return NextResponse.json({ ok: true });
}
