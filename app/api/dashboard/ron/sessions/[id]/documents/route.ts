import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { addBlueNotaryDocuments } from '@/lib/bluenotary/client';
import { buildDocumentPayload, deriveBlueNotaryDocumentName } from '@/lib/bluenotary/documents';
import { redactBNPayload } from '@/lib/bluenotary/redaction';

// POST /api/dashboard/ron/sessions/[id]/documents — upload one already-seeded Matter document to BlueNotary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const { id: sessionId } = await params;
    const body = await request.json();
    const { document_id, smart_tags } = body as { document_id: string; smart_tags?: string[] };

    if (!document_id) return NextResponse.json({ error: 'document_id is required' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: session } = await supabase
      .from('ron_sessions')
      .select('id, matter_id, bn_session_id, milano_ron_status, payment_gate_status')
      .eq('id', sessionId)
      .single();

    if (!session?.bn_session_id) return NextResponse.json({ error: 'Session not found or missing BN session id' }, { status: 404 });
    if (session.milano_ron_status === 'RON_EXPIRED') return NextResponse.json({ error: 'Session has expired' }, { status: 400 });
    if (session.payment_gate_status !== 'UNLOCKED') return NextResponse.json({ error: 'Payment gate is locked' }, { status: 403 });

    const { data: docRecord } = await supabase
      .from('ron_documents')
      .select('id, document_name, document_type, storage_bucket, storage_path, template_id, smart_tags_applied')
      .eq('id', document_id)
      .eq('ron_session_id', sessionId)
      .single();

    if (!docRecord?.storage_path) return NextResponse.json({ error: 'Document not found or missing storage path' }, { status: 404 });

    const storageBucket = docRecord.storage_bucket || 'deal-documents';
    const { data: fileData, error: storageErr } = await supabase.storage
      .from(storageBucket)
      .download(docRecord.storage_path);

    if (storageErr || !fileData) return NextResponse.json({ error: 'Failed to retrieve Matter document from storage' }, { status: 500 });

    const arrayBuffer = await fileData.arrayBuffer();
    const base64Content = Buffer.from(arrayBuffer).toString('base64');
    const bnDocName = deriveBlueNotaryDocumentName(docRecord.document_name ?? docRecord.storage_path, docRecord.document_type);
    const docPayload = buildDocumentPayload(bnDocName, base64Content, docRecord.template_id ?? undefined, smart_tags);

    await addBlueNotaryDocuments(session.bn_session_id, [docPayload]);
    (docPayload as { base64_content?: string }).base64_content = '';

    await supabase
      .from('ron_documents')
      .update({
        blue_notary_document_name: bnDocName,
        uploaded_to_bluenotary: true,
        smart_tags_applied: !!smart_tags?.length,
        document_status: 'UPLOADED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', document_id);

    await supabase.from('ron_audit_events').insert({
      matter_id: session.matter_id,
      ron_session_id: sessionId,
      event_type: 'RON_DOCUMENT_UPLOADED',
      description: `Document uploaded to BlueNotary: ${bnDocName}`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: { document_id, bn_document_name: bnDocName, storage_bucket: storageBucket },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document_id,
        blue_notary_document_name: bnDocName,
        uploaded_to_bluenotary: true,
        smart_tags_applied: !!smart_tags?.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[RON documents POST]', redactBNPayload({ error: message }));
    if (message.includes('Unauthorized') || message.includes('access_denied')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
