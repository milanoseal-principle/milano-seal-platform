import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { createBlueNotarySession } from '@/lib/bluenotary/client';
import { assertCanCreateRONSession } from '@/lib/bluenotary/guards';
import { buildSessionPayload, buildNotarizationId } from '@/lib/bluenotary/session';
import { redactBNPayload } from '@/lib/bluenotary/redaction';

// POST /api/dashboard/ron/sessions — create a new RON session
export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const body = await request.json();
    const { matter_id, session_timing, signers } = body as {
      matter_id: string;
      session_timing?: string;
      signers?: Array<{
        first_name: string;
        middle_name?: string;
        last_name: string;
        email: string;
        phone?: string;
        state?: string;
        authentication_type?: string;
      }>;
    };

    if (!matter_id) return NextResponse.json({ error: 'matter_id is required' }, { status: 400 });

    const supabase = createAdminClient();
    await assertCanCreateRONSession(supabase, matter_id, userId);

    const { data: matter, error: matterErr } = await supabase
      .from('deals')
      .select('id, client_name, email, phone, document_type, destination_country, origin_state, execution_truth')
      .eq('id', matter_id)
      .single();

    if (matterErr || !matter) return NextResponse.json({ error: 'Matter not found' }, { status: 404 });

    const executionTruth = (matter.execution_truth ?? {}) as Record<string, unknown>;
    const signerState = String(executionTruth.signer_location ?? matter.origin_state ?? '').trim();

    const signerList = signers ?? [
      {
        first_name: (matter.client_name ?? '').split(' ')[0] ?? '',
        last_name: (matter.client_name ?? '').split(' ').slice(1).join(' ') || 'Unknown',
        email: matter.email ?? '',
        phone: matter.phone ?? undefined,
        state: signerState || undefined,
        authentication_type: 'kba',
      },
    ];

    const notarizationId = buildNotarizationId(matter_id.slice(0, 8));
    const bnPayload = {
      ...buildSessionPayload(
        { ...matter, short_id: matter_id.slice(0, 8) },
        signerList,
        session_timing
      ),
      notarization_id: notarizationId,
    };

    // External BlueNotary session creation occurs only after all guards pass.
    const bnSession = await createBlueNotarySession(bnPayload);

    const { data: ronSession, error: sessionInsertErr } = await supabase
      .from('ron_sessions')
      .insert({
        matter_id,
        notarization_id: notarizationId,
        bn_session_id: bnSession.id ?? null,
        signing_type: 'ron',
        session_type: bnPayload.session_type,
        notarization_timing_type: bnPayload.notarization_timing_type,
        session_timing: session_timing ?? null,
        blue_notary_status: bnSession.status ?? 'DRAFT',
        milano_ron_status: 'RON_SESSION_CREATED',
        payment_gate_status: 'UNLOCKED',
        created_by: userId,
        raw_session: {},
      })
      .select('id, matter_id, notarization_id, bn_session_id, milano_ron_status, created_at')
      .single();

    if (sessionInsertErr || !ronSession) {
      return NextResponse.json({ error: 'Failed to store RON session' }, { status: 500 });
    }

    const signerInserts = signerList.map((s, i) => ({
      ron_session_id: ronSession.id,
      matter_id,
      signer_index: i,
      first_name: s.first_name,
      middle_name: s.middle_name ?? null,
      last_name: s.last_name,
      email: s.email,
      phone: s.phone ?? null,
      state: s.state ?? signerState ?? null,
      authentication_type: s.authentication_type ?? 'kba',
    }));
    await supabase.from('ron_signers').insert(signerInserts);

    // Seed the existing Matter package into the canonical RON document queue.
    // This does NOT send bytes to BlueNotary; operator upload remains a separate audited action.
    const { data: matterFiles } = await supabase
      .from('files')
      .select('id, name, storage_path, mime_type, category')
      .eq('deal_id', matter_id)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });

    if (matterFiles?.length) {
      await supabase.from('ron_documents').insert(
        matterFiles.map((file) => ({
          ron_session_id: ronSession.id,
          matter_id,
          document_id: file.id,
          document_name: file.name,
          document_type: matter.document_type,
          storage_bucket: 'deal-documents',
          storage_path: file.storage_path,
          document_status: 'PENDING',
        }))
      );
    }

    await supabase.from('ron_audit_events').insert({
      matter_id,
      ron_session_id: ronSession.id,
      event_type: 'RON_SESSION_CREATED',
      description: `RON session created by ${role} (${userId})`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: {
        notarization_id: notarizationId,
        signer_state: signerState || null,
        document_count: matterFiles?.length ?? 0,
        notarial_act: executionTruth.notarial_act ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      session: {
        id: ronSession.id,
        matter_id: ronSession.matter_id,
        notarization_id: ronSession.notarization_id,
        milano_ron_status: ronSession.milano_ron_status,
        created_at: ronSession.created_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (
      message.includes('PAYMENT') ||
      message.includes('SIGNER') ||
      message.includes('ACTIVE_SESSION') ||
      message.includes('RON_') ||
      message.includes('NOTARIAL_ACT')
    ) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('access_denied') || message.includes('login')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[RON sessions POST]', redactBNPayload({ error: message }));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/dashboard/ron/sessions — list RON sessions for operator
export async function GET() {
  try {
    await requireDashboardAccess();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('ron_sessions')
      .select(`
        id,
        matter_id,
        notarization_id,
        milano_ron_status,
        identity_status,
        kba_status,
        biometric_status,
        payment_gate_status,
        session_url_status,
        final_documents_status,
        document_tagging_status,
        session_timing,
        scheduled_at,
        started_at,
        completed_at,
        expired_at,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sessions: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
