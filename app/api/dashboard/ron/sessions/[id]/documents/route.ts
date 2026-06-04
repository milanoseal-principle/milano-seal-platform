import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { addBlueNotaryDocuments } from '@/lib/bluenotary/client';
import { buildDocumentPayload, deriveBlueNotaryDocumentName } from '@/lib/bluenotary/documents';
import { redactBNPayload } from '@/lib/bluenotary/redaction';

// POST /api/dashboard/ron/sessions/[id]/documents — upload document to BlueNotary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const { id: sessionId } = await params;
    const body = await request.json();
    const { document_id, smart_tags } = body as {
      document_id: string;
      smart_tags?: string[];
    };

    if (!document_id) {
      return NextResponse.json({ error: 'document_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Load the RON session
    const { data: session } = await supabase
      .from('ron_sessions')
      .select('id, matter_id, bn_session_id, milano_ron_status')
      .eq('id', sessionId)
      .single();

    if (!session?.bn_session_id) {
      return NextResponse.json({ error: 'Session not found or missing BN session id' }, { status: 404 });
    }

    if (session.milano_ron_status === 'RON_EXPIRED') {
      return NextResponse.json({ error: 'Session has expired' }, { status: 400 });
    }

    // Load document record from storage
    const { data: docRecord } = await supabase
      .from('ron_documents')
      .select('id, document_name, document_type, storage_path, template_id, smart_tags_applied')
      .eq('id', document_id)
      .eq('ron_session_id', sessionId)
      .single();

    if (!docRecord?.storage_path) {
      return NextResponse.json({ error: 'Document not found or missing storage path' }, { status: 404 });
    }

    // Retrieve document from private Supabase storage — server-side only
    const { data: fileData, error: storageErr } = await supabase.storage
      .from('documents')
      .download(docRecord.storage_path);

    if (storageErr || !fileData) {
      return NextResponse.json({ error: 'Failed to retrieve document from storage' }, { status: 500 });
    }

    // Convert to base64 server-side — NEVER expose this to client
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Content = Buffer.from(arrayBuffer).toString('base64');

    const bnDocName = deriveBlueNotaryDocumentName(
      docRecord.storage_path,
      docRecord.document_type
    );

    const docPayload = buildDocumentPayload(
      bnDocName,
      base64Content,
      docRecord.template_id ?? undefined,
      smart_tags
    );

    // Upload to BlueNotary
    await addBlueNotaryDocuments(session.bn_session_id, [docPayload]);

    // Immediately clear base64 from scope — set to empty string
    // (JS GC will handle the rest; we just ensure it's not in any response)
    (docPayload as { base64_content?: string }).base64_content = '';

    // Mark uploaded
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

    // Audit event
    await supabase.from('ron_audit_events').insert({
      matter_id: session.matter_id,
      ron_session_id: sessionId,
      event_type: 'RON_DOCUMENT_UPLOADED',
      description: `Document uploaded to BlueNotary: ${bnDocName}`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: { document_id, bn_document_name: bnDocName },
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
