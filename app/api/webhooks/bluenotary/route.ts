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

async function advanceMatterIntoExecution(
  supabase: ReturnType<typeof createAdminClient>,
  matterId: string,
  ronSessionId: string,
  providerEvent: string
) {
  const { data: matter } = await supabase
    .from('deals')
    .select('id, deal_id, status, deal_status')
    .eq('id', matterId)
    .maybeSingle();

  if (!matter) return;

  const current = String(matter.deal_status ?? matter.status ?? '');
  if (current === 'in_execution') return;
  if (current !== 'scheduled') return;

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
  if (error || !advanced) return;

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

  const { data: existing } = await supabase
    .from('ron_webhook_events')
    .select('id')
    .eq('event_hash', eventHash)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

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

  await supabase.from('ron_webhook_events').insert({
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

  await supabase
    .from('ron_sessions')
    .update(sessionUpdate)
    .eq('id', ronSessionId);

  if (
    matterId &&
    (payload.event_type === 'session_started' || payload.event_type === 'session_completed')
  ) {
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
                signed_storage_path: storagePath,
                signed_document_received: true,
                document_status: 'SIGNED',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'ron_session_id,document_name' }
            );

          (doc as { base64_content?: string }).base64_content = '';
        }

        // Signed-document retrieval is provider evidence only. Apostille advancement
        // remains an explicit operator QA action through advance-to-apostille.
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
