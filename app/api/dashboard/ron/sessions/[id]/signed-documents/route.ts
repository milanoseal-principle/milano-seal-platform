import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { getBlueNotarySignedDocuments } from '@/lib/bluenotary/client';
import { assertCanRetrieveSignedDocuments } from '@/lib/bluenotary/guards';
import { redactBNPayload } from '@/lib/bluenotary/redaction';
import { storeRONExecutedDocuments } from '@/lib/bluenotary/signedDocumentStorage';

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

    const storedIds = await storeRONExecutedDocuments(supabase, session, signedDocs);
    const verified = await supabase.rpc('ron_statutory_evidence_verified', {p_session:sessionId});
    if (verified.error) throw new Error('Statutory evidence state could not be checked');
    await supabase
      .from('ron_sessions')
      .update({
        milano_ron_status: verified.data === true ? 'SIGNED_DOCS_RETRIEVED' : 'SESSION_PROCESSING',
        final_documents_status: 'AVAILABLE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    await supabase.from('ron_audit_events').insert({
      matter_id: session.matter_id,
      ron_session_id: sessionId,
      event_type: 'RON_SIGNED_DOCUMENTS_RETRIEVED',
      description: `${storedIds.length} signed document(s) retrieved and stored in vault`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: { document_count: storedIds.length },
    });

    return NextResponse.json({
      success: true,
      documents_stored: storedIds.length,
      next_action: verified.data === true ? 'APOSTILLE_QA_REVIEW' : 'STATUTORY_EVIDENCE_REVIEW',
      message: 'Executed document versions secured. Verify statutory evidence before execution completion or Apostille QA.',
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
