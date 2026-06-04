import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyBNWebhookAuth, computeEventHash } from '@/lib/bluenotary/webhook';
import { mapBNEventToMilanoStatus } from '@/lib/bluenotary/status';
import { getBlueNotarySignedDocuments } from '@/lib/bluenotary/client';
import { redactBNPayload } from '@/lib/bluenotary/redaction';
import { sanitizeDocumentName } from '@/lib/bluenotary/documents';
import type { BNWebhookPayload } from '@/lib/bluenotary/types';

export async function POST(request: NextRequest) {
  // 1. Verify auth
  if (!verifyBNWebhookAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: BNWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 2. Compute idempotency hash and check for duplicate
  const eventHash = computeEventHash(payload);

  const { data: existing } = await supabase
    .from('ron_webhook_events')
    .select('id')
    .eq('event_hash', eventHash)
    .maybeSingle();

  if (existing) {
    // Duplicate — return 200 (already processed)
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // 3. Find ron_session
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
    // Unknown session — store as review required, return 200
    console.warn('[BN webhook] Unknown session for event', {
      event_type: payload.event_type,
      notarization_id: payload.notarization_id,
    });
    return NextResponse.json({ ok: true, status: 'review_required' });
  }

  // 5. Map event to MilanoRONStatus
  const newStatus = mapBNEventToMilanoStatus(payload.event_type);

  // 6. Build session update
  const sessionUpdate: Record<string, unknown> = {
    milano_ron_status: newStatus,
    updated_at: new Date().toISOString(),
  };

  // Map specific event types to field updates
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

  // 7. Update signer record if signer event
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

  // 8. On session_completed: retrieve and store signed documents
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

          // Clear base64
          (doc as { base64_content?: string }).base64_content = '';
        }

        // Update to SIGNED_DOCS_RETRIEVED — DO NOT auto-release or auto-advance
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
          description: `Signed documents auto-retrieved via webhook. Next action: Apostille QA Review`,
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

  // 9. Write audit event
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

  // 10. Mark webhook event as processed
  await supabase
    .from('ron_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('event_hash', eventHash);

  return NextResponse.json({ ok: true });
}
