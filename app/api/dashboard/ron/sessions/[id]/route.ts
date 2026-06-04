import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';

// GET /api/dashboard/ron/sessions/[id] — get single session with signers and documents
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: session, error } = await supabase
      .from('ron_sessions')
      .select(`
        id,
        matter_id,
        notarization_id,
        bn_session_id,
        signing_type,
        session_type,
        notarization_timing_type,
        session_timing,
        blue_notary_status,
        milano_ron_status,
        identity_status,
        kba_status,
        biometric_status,
        document_tagging_status,
        payment_gate_status,
        session_url_status,
        final_documents_status,
        created_by,
        created_at,
        updated_at,
        scheduled_at,
        started_at,
        completed_at,
        expired_at
      `)
      .eq('id', id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Load signers (exclude encrypted signing URL from response)
    const { data: signers } = await supabase
      .from('ron_signers')
      .select(`
        id,
        signer_index,
        first_name,
        middle_name,
        last_name,
        email,
        phone,
        state,
        authentication_type,
        signing_url_released,
        identity_status,
        kba_status,
        biometric_status,
        joined_at,
        left_at,
        completed_at
      `)
      .eq('ron_session_id', id)
      .order('signer_index');

    // Load documents
    const { data: documents } = await supabase
      .from('ron_documents')
      .select(`
        id,
        document_name,
        document_type,
        blue_notary_document_name,
        template_id,
        smart_tags_applied,
        uploaded_to_bluenotary,
        signed_document_received,
        document_status,
        created_at
      `)
      .eq('ron_session_id', id);

    // Load audit events
    const { data: auditEvents } = await supabase
      .from('ron_audit_events')
      .select('id, event_type, description, actor_role, source, created_at, metadata')
      .eq('ron_session_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      session,
      signers: signers ?? [],
      documents: documents ?? [],
      audit_events: auditEvents ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
