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

    if (!matter_id) {
      return NextResponse.json({ error: 'matter_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Payment gate + active session check
    await assertCanCreateRONSession(supabase, matter_id, userId);

    // Load matter for payload building
    const { data: matter, error: matterErr } = await supabase
      .from('deals')
      .select('id, client_name, email, phone, document_type, destination_country')
      .eq('id', matter_id)
      .single();

    if (matterErr || !matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Build signer list — use provided signers or derive from matter
    const signerList = signers ?? [
      {
        first_name: (matter.client_name ?? '').split(' ')[0] ?? '',
        last_name: (matter.client_name ?? '').split(' ').slice(1).join(' ') || 'Unknown',
        email: matter.email ?? '',
        phone: matter.phone ?? undefined,
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

    // Call BlueNotary
    const bnSession = await createBlueNotarySession(bnPayload);

    // Store ron_session
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
        raw_session: {}, // Never store raw BN response containing signing URLs
      })
      .select('id, matter_id, notarization_id, bn_session_id, milano_ron_status, created_at')
      .single();

    if (sessionInsertErr || !ronSession) {
      return NextResponse.json({ error: 'Failed to store RON session' }, { status: 500 });
    }

    // Store ron_signers
    const signerInserts = signerList.map((s, i) => ({
      ron_session_id: ronSession.id,
      matter_id,
      signer_index: i,
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email,
      phone: s.phone ?? null,
      authentication_type: s.authentication_type ?? 'kba',
      // signing_url_encrypted: stored separately when BN provides it
    }));

    await supabase.from('ron_signers').insert(signerInserts);

    // Audit event
    await supabase.from('ron_audit_events').insert({
      matter_id,
      ron_session_id: ronSession.id,
      event_type: 'RON_SESSION_CREATED',
      description: `RON session created by ${role} (${userId})`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: { notarization_id: notarizationId },
    });

    // Return sanitized response — no raw BN payload, no signing URLs
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
    if (message.includes('PAYMENT') || message.includes('SIGNER') || message.includes('ACTIVE_SESSION')) {
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
