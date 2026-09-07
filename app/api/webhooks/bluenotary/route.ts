import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeEventHash } from '@/lib/bluenotary/webhook';
import { mapBNEventToMilanoStatus } from '@/lib/bluenotary/status';
import { getBlueNotarySignedDocuments } from '@/lib/bluenotary/client';
import { redactBNPayload } from '@/lib/bluenotary/redaction';
import { sanitizeDocumentName } from '@/lib/bluenotary/documents';
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

  if (payload.notarization_id) {
    const { data: session } = await supabase
      .from('ron_sessions')
      .select('id, matter_id')
      .eq('notarization_id', payload.notarization_id)
      .maybeSingle();

    if (session) {
      ronSessionId = session.id;
      matterId = session.matter_id;
    }
  }

  if (!ronSessionId && payload.bn_session_id) {
    const { data: session } = await supabase
      .from('ron_sessions')
      .select('id, matter_id')
      .eq('bn_session_id', payload.bn_session_id)
      .maybeSingle();

    if (session) {
      ronSessionId = session.id;
      matterId = session.matter_id;
    }
  }

  // 4. Store webhook event (before processing to ensure we don't lose it)
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

  if (eventInsertError?.code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (eventInsertError) {
    console.error('[BN webhook] Failed to persist authenticated event', {
      event_type: payload.event_type,
      code: eventInsertError.code,
    });
    return NextResponse.json({ error: 'Event persistence failed' }, { status: 500 });
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
    milano_ron_status: newStatus,
    updated_at: new Date().toISOString(),
  };

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
    case 'session_started':
      sessionUpdate.started_at = new Date().toISOString();
      break;
    case 'session_completed':
      sessionUpdate.completed_at = new Date().toISOString();
      break;
    case 'session_expired':
      sessionUpdate.expired_at = new Date().toISOString();
      sessionUpdate.session_url_status = 'BLOCKED';
      break;
  }

  const { error: sessionUpdateError } = await supabase
    .from('ron_sessions')
    .update(sessionUpdate)
    .eq('id', ronSessionId);

  // Trusted provider execution evidence advances the same Matter exactly once.
  // The conditional update is optimistic concurrency protection; an already
  // advanced Matter is an idempotent no-op and an impossible state is reviewed.
  if (payload.event_type === 'session_started' && matterId) {
    const now = new Date().toISOString();
    const { data: advanced, error: transitionError } = await supabase
      .from('deals')
      .update({
        status: 'in_execution',
        deal_status: 'in_execution',
        execution_at: now,
        executed_at: now,
        last_activity: now,
      })
      .eq('id', matterId)
      .eq('status', 'scheduled')
      .select('id')
      .maybeSingle();

    if (!advanced) {
      const { data: current } = await supabase
        .from('deals')
        .select('status, deal_status')
        .eq('id', matterId)
        .maybeSingle();
      if (transitionError || current?.status !== 'in_execution') {
        await supabase.from('ron_audit_events').insert({
          matter_id: matterId,
          ron_session_id: ronSessionId,
          event_type: 'RON_MATTER_TRANSITION_REVIEW_REQUIRED',
          description: 'Provider execution began but the Matter was not in the scheduled state.',
          actor_role: 'system',
          source: 'bluenotary_webhook',
          metadata: { current_state: current?.status ?? null },
        });
      }
    } else {
      await supabase.from('ron_audit_events').insert({
        matter_id: matterId,
        ron_session_id: ronSessionId,
        event_type: 'RON_MATTER_EXECUTION_STARTED',
        description: 'Trusted BlueNotary evidence advanced the Matter from scheduled to in_execution.',
        actor_role: 'bluenotary',
        source: 'bluenotary_webhook',
        metadata: { previous_state: 'scheduled', new_state: 'in_execution' },
      });
    }
  }

  // 7. Update signer record if signer event
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
        case 'session_completed':
          signerUpdate.completed_at = new Date().toISOString();
          break;
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
    try {
      const { data: session } = await supabase
        .from('ron_sessions')
        .select('bn_session_id, matter_id')
        .eq('id', ronSessionId)
        .single();

      if (session?.bn_session_id) {
        const signedDocs = await getBlueNotarySignedDocuments(session.bn_session_id);

        for (const doc of signedDocs ?? []) {
          const buffer = Buffer.from(doc.base64_content, 'base64');
          const safeName = sanitizeDocumentName(doc.document_name ?? `signed_${Date.now()}.pdf`);
          const storagePath = `ron/${session.matter_id}/${ronSessionId}/${safeName}`;

          await supabase.storage
            .from('documents')
            .upload(storagePath, buffer, {
              contentType: doc.content_type ?? 'application/pdf',
              upsert: true,
            });

          await supabase
            .from('ron_documents')
            .upsert(
              {
                ron_session_id: ronSessionId,
                matter_id: session.matter_id,
                document_name: safeName,
                blue_notary_document_name: doc.document_name,
                storage_bucket: 'documents',
                signed_storage_path: storagePath,
                storage_bucket: 'documents',
                signed_document_received: true,
                document_status: 'SIGNED',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'ron_session_id,document_name' }
            );

          (doc as { base64_content?: string }).base64_content = '';
        }

        await supabase
          .from('ron_sessions')
          .update({
            milano_ron_status: 'SIGNED_DOCS_RETRIEVED',
            final_documents_status: 'AVAILABLE',
            updated_at: new Date().toISOString(),
          })
          .eq('id', ronSessionId);

        await supabase.from('ron_audit_events').insert({
          matter_id: matterId,
          ron_session_id: ronSessionId,
          event_type: 'RON_SIGNED_DOCUMENTS_RETRIEVED',
          description: 'Signed documents auto-retrieved via webhook. Next action: Apostille QA Review',
          actor_role: 'system',
          source: 'bluenotary_webhook',
          metadata: { document_count: signedDocs?.length ?? 0 },
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
    },
  });

  await supabase
    .from('ron_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('event_hash', eventHash);

  return NextResponse.json({ ok: true });
}
