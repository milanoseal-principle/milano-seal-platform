import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { getBlueNotarySignedDocuments } from '@/lib/bluenotary/client';
import { assertCanRetrieveSignedDocuments } from '@/lib/bluenotary/guards';
import { redactBNPayload } from '@/lib/bluenotary/redaction';
import { sanitizeDocumentName } from '@/lib/bluenotary/documents';

// POST /api/dashboard/ron/sessions/[id]/signed-documents
// Retrieve signed documents from BlueNotary and store in private vault.
// NEVER expose base64 in response.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const { id: sessionId } = await params;

    const supabase = createAdminClient();

    await assertCanRetrieveSignedDocuments(supabase, sessionId);

    const { data: session } = await supabase
      .from('ron_sessions')
      .select('id, matter_id, bn_session_id')
      .eq('id', sessionId)
      .single();

    if (!session?.bn_session_id) {
      return NextResponse.json({ error: 'Session or BN session id not found' }, { status: 404 });
    }

    const signedDocs = await getBlueNotarySignedDocuments(session.bn_session_id);

    if (!signedDocs || signedDocs.length === 0) {
      return NextResponse.json({ error: 'No signed documents available yet' }, { status: 404 });
    }

    const storedPaths: string[] = [];

    for (const doc of signedDocs) {
      const buffer = Buffer.from(doc.base64_content, 'base64');
      const safeName = sanitizeDocumentName(doc.document_name ?? `signed_${Date.now()}.pdf`);
      const storagePath = `ron/${session.matter_id}/${sessionId}/${safeName}`;

      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, {
          contentType: doc.content_type ?? 'application/pdf',
          upsert: true,
        });

      if (uploadErr) {
        console.error('[RON signed-docs storage]', redactBNPayload({ error: uploadErr.message, path: storagePath }));
        continue;
      }

      storedPaths.push(storagePath);

      await supabase
        .from('ron_documents')
        .upsert(
          {
            ron_session_id: sessionId,
            matter_id: session.matter_id,
            document_name: safeName,
            blue_notary_document_name: doc.document_name,
            storage_bucket: 'documents',
            signed_storage_path: storagePath,
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
      .eq('id', sessionId);

    await supabase.from('ron_audit_events').insert({
      matter_id: session.matter_id,
      ron_session_id: sessionId,
      event_type: 'RON_SIGNED_DOCUMENTS_RETRIEVED',
      description: `${storedPaths.length} signed document(s) retrieved and stored in vault`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: { document_count: storedPaths.length },
    });

    return NextResponse.json({
      success: true,
      documents_stored: storedPaths.length,
      next_action: 'APOSTILLE_QA_REVIEW',
      message: 'Signed documents secured in vault. Next step: Apostille QA Review.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('SESSION_NOT_COMPLETED') || message.includes('SESSION_NOT_FOUND')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.includes('Unauthorized') || message.includes('access_denied')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[RON signed-docs POST]', redactBNPayload({ error: message }));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
