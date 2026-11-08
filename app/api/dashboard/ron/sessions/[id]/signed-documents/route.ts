import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { getBlueNotarySignedDocuments } from '@/lib/bluenotary/client';
import { assertCanRetrieveSignedDocuments, RONGuardError } from '@/lib/bluenotary/guards';
import { redactBNPayload } from '@/lib/bluenotary/redaction';
import { captureExecutedRonDocuments } from '@/lib/ron/executedCapture';
import { storeRONExecutedDocuments } from '@/lib/bluenotary/signedDocumentStorage';

// POST /api/dashboard/ron/sessions/[id]/signed-documents
// Retrieve signed documents from BlueNotary into immutable content-addressed
// executed versions. Never overwrites previously captured evidence and never
// exposes base64 in the response.
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
      .select('id, matter_id, bn_session_id, ron_lifecycle_state, milano_ron_status')
      .eq('id', sessionId)
      .single();

    if (!session?.bn_session_id) {
      return NextResponse.json({ error: 'Session or BN session id not found' }, { status: 404 });
    }

    const signedDocs = await getBlueNotarySignedDocuments(session.bn_session_id);

    if (!signedDocs || signedDocs.length === 0) {
      return NextResponse.json(
        { error: 'No signed documents available yet', retry_safe: true, next_owner: 'PROVIDER_EXTERNAL' },
        { status: 404 }
      );
    }

    const captured = await captureExecutedRonDocuments(supabase, session, signedDocs, {
      actorId: userId,
      actorRole: role,
      source: 'milano_seal',
    });

    const summary = {
      captured: captured.filter((c) => c.decision === 'capture').length,
      duplicates: captured.filter((c) => c.decision === 'duplicate').length,
      conflicts: captured.filter((c) => c.decision === 'conflict').length,
    };
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
      description: `${summary.captured} executed document(s) captured, ${summary.duplicates} already captured, ${summary.conflicts} conflict(s) preserved for review`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: { document_count: captured.length, ...summary },
    });

    return NextResponse.json({
      success: summary.conflicts === 0,
      documents_stored: summary.captured,
      ...summary,
      documents: captured.map((c) => ({ document_name: c.document_name, sha256: c.sha256, decision: c.decision })),
      retry_safe: true,
      next_action: summary.conflicts > 0 ? 'RESOLVE_EXECUTED_DOCUMENT_CONFLICT' : 'RON_EVIDENCE_VERIFICATION',
      message:
        summary.conflicts > 0
          ? 'Previously captured executed evidence was preserved. A differing provider copy requires operator review.'
          : 'Executed documents secured as immutable versions. Next step: statutory evidence verification.',
      description: `${storedIds.length} signed document(s) retrieved and stored in vault`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: { document_count: storedIds.length },
    });

  } catch (err) {
    if (err instanceof RONGuardError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.code === 'SESSION_NOT_FOUND' ? 404 : 409 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('Unauthorized') || message.includes('access_denied')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[RON signed-docs POST]', redactBNPayload({ error: message }));
    return NextResponse.json(
      { error: 'Executed document capture did not complete. Already captured evidence is unchanged; retry is safe.', retry_safe: true },
      { status: 500 }
    );
  }
}
