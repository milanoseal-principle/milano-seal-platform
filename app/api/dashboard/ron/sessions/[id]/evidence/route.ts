import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { appendMatterEvidence } from '@/lib/matter/evidenceLedger';
import {
  evaluateRonStatutoryEvidence,
  isTerminalRonLifecycle,
  sanitizeEvidencePatch,
  SESSION_EVIDENCE_FIELDS,
  SESSION_REVIEW_FIELDS,
  SIGNER_EVIDENCE_FIELDS,
} from '@/lib/ron/evidence';
import { databaseMissingEvidence, loadRonEvidence, ronRouteError } from '@/lib/ron/evidenceServer';

export const runtime = 'nodejs';

type Change = { scope: string; field: string; prior: unknown; next: unknown };

// GET /api/dashboard/ron/sessions/[id]/evidence — operator evidence posture.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const supabase = createAdminClient();
    const loaded = await loadRonEvidence(supabase, id);
    if (!loaded) return NextResponse.json({ ok: false, code: 'SESSION_NOT_FOUND' }, { status: 404 });
    const { data: audit } = await supabase
      .from('ron_audit_events')
      .select('id, event_type, description, actor_id, actor_role, source, created_at, metadata')
      .eq('ron_session_id', id)
      .like('event_type', 'RON_%')
      .order('created_at', { ascending: false })
      .limit(100);
    return NextResponse.json({
      ok: true,
      lifecycle: loaded.lifecycle,
      session: loaded.session,
      signers: loaded.signers,
      documents: loaded.documents,
      missing_for_verification: evaluateRonStatutoryEvidence(loaded.input, 'verify'),
      missing_for_completion: evaluateRonStatutoryEvidence(loaded.input, 'complete'),
      database_missing: await databaseMissingEvidence(supabase, id),
      audit: audit ?? [],
    });
  } catch (error) {
    const failure = ronRouteError(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}

// POST /api/dashboard/ron/sessions/[id]/evidence — record or correct governed evidence.
// Every change appends audit evidence; corrections of existing values require a reason.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const { id } = await params;
    const body = (await request.json().catch(() => null)) as {
      session?: Record<string, unknown>;
      signers?: Array<Record<string, unknown>>;
      reason?: unknown;
    } | null;
    if (!body || typeof body !== 'object') return NextResponse.json({ ok: false, code: 'INVALID_JSON' }, { status: 400 });
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';

    const supabase = createAdminClient();
    const loaded = await loadRonEvidence(supabase, id);
    if (!loaded) return NextResponse.json({ ok: false, code: 'SESSION_NOT_FOUND' }, { status: 404 });
    const { session, signers, lifecycle } = loaded;
    if (isTerminalRonLifecycle(lifecycle)) {
      return NextResponse.json({ ok: false, code: 'RON_EVIDENCE_FROZEN', lifecycle }, { status: 409 });
    }
    const frozen = lifecycle === 'EVIDENCE_VERIFIED';

    const sessionPatch = { ...(body.session ?? {}) };
    const statutoryKeys = Object.keys(sessionPatch).filter((k) => !(SESSION_REVIEW_FIELDS as readonly string[]).includes(k));
    if (frozen && (statutoryKeys.length > 0 || (body.signers ?? []).length > 0)) {
      return NextResponse.json(
        { ok: false, code: 'RON_EVIDENCE_FROZEN', message: 'Verified evidence is frozen. Reopen verification with a reason to correct it.' },
        { status: 409 }
      );
    }
    const sanitizedSession = sanitizeEvidencePatch(sessionPatch, [...SESSION_EVIDENCE_FIELDS, ...SESSION_REVIEW_FIELDS]);
    if (!sanitizedSession.ok) return NextResponse.json({ ok: false, code: sanitizedSession.code, field: sanitizedSession.field }, { status: 422 });
    const sessionValues = sanitizedSession.values;

    if ('qc_status' in sessionValues || 'qc_review_reference' in sessionValues) {
      if (lifecycle !== 'EVIDENCE_VERIFIED') return NextResponse.json({ ok: false, code: 'QC_REQUIRES_VERIFIED_EVIDENCE' }, { status: 409 });
      const qcStatus = (sessionValues.qc_status ?? session.qc_status) as string;
      const qcRef = (sessionValues.qc_review_reference ?? session.qc_review_reference) as string | null;
      if (qcStatus === 'passed' && !qcRef) return NextResponse.json({ ok: false, code: 'QC_REFERENCE_REQUIRED' }, { status: 422 });
      sessionValues.qc_recorded_at = new Date().toISOString();
      sessionValues.qc_recorded_by = userId;
    }
    if ('exception_status' in sessionValues) {
      if (!reason) return NextResponse.json({ ok: false, code: 'EXCEPTION_REASON_REQUIRED' }, { status: 422 });
      if (sessionValues.exception_status === 'open' && !sessionValues.exception_reason) sessionValues.exception_reason = reason;
    }

    const changes: Change[] = [];
    for (const [field, next] of Object.entries(sessionValues)) {
      if (field === 'qc_recorded_at' || field === 'qc_recorded_by') continue;
      const prior = (session as Record<string, unknown>)[field] ?? null;
      if (JSON.stringify(prior) !== JSON.stringify(next)) changes.push({ scope: 'session', field, prior, next });
    }

    const signerUpdates: Array<{ id: string | null; values: Record<string, unknown> }> = [];
    for (const entry of body.signers ?? []) {
      const { id: signerId, first_name, last_name, ...rest } = entry;
      const sanitized = sanitizeEvidencePatch(rest, SIGNER_EVIDENCE_FIELDS);
      if (!sanitized.ok) return NextResponse.json({ ok: false, code: sanitized.code, field: sanitized.field }, { status: 422 });
      if (typeof signerId === 'string') {
        const existing = signers.find((s) => s.id === signerId);
        if (!existing) return NextResponse.json({ ok: false, code: 'SIGNER_NOT_IN_SESSION' }, { status: 404 });
        for (const [field, next] of Object.entries(sanitized.values)) {
          const prior = (existing as Record<string, unknown>)[field] ?? null;
          if (JSON.stringify(prior) !== JSON.stringify(next)) changes.push({ scope: `signer:${signerId}`, field, prior, next });
        }
        signerUpdates.push({ id: signerId, values: sanitized.values });
      } else {
        if (sanitized.values.party_role !== 'witness') return NextResponse.json({ ok: false, code: 'NEW_PARTY_MUST_BE_WITNESS' }, { status: 422 });
        if (typeof first_name !== 'string' || typeof last_name !== 'string' || !first_name.trim() || !last_name.trim()) {
          return NextResponse.json({ ok: false, code: 'WITNESS_NAME_REQUIRED' }, { status: 422 });
        }
        signerUpdates.push({ id: null, values: { ...sanitized.values, first_name: first_name.trim(), last_name: last_name.trim() } });
        changes.push({ scope: 'signer:new_witness', field: 'party_role', prior: null, next: 'witness' });
      }
    }

    if (changes.length === 0) return NextResponse.json({ ok: true, duplicate: true, changes: [] });
    const isCorrection = changes.some((c) => c.prior !== null && c.prior !== undefined);
    if (isCorrection && !reason) {
      return NextResponse.json({ ok: false, code: 'CORRECTION_REASON_REQUIRED', message: 'Changing previously recorded evidence requires a reason.' }, { status: 422 });
    }

    if (Object.keys(sessionValues).length > 0) {
      const { data: updated, error } = await supabase
        .from('ron_sessions')
        .update(sessionValues)
        .eq('id', id)
        .eq('updated_at', session.updated_at)
        .eq('ron_lifecycle_state', lifecycle)
        .select('id')
        .maybeSingle();
      if (error) return NextResponse.json({ ok: false, code: error.message || 'RON_EVIDENCE_WRITE_REJECTED' }, { status: 409 });
      if (!updated) return NextResponse.json({ ok: false, code: 'STALE_RON_SESSION', message: 'Session changed. Refresh and retry.' }, { status: 409 });
    }

    for (const update of signerUpdates) {
      const { error } = update.id
        ? await supabase.from('ron_signers').update(update.values).eq('id', update.id).eq('ron_session_id', id)
        : await supabase.from('ron_signers').insert({ ...update.values, ron_session_id: id, matter_id: session.matter_id, signer_index: signers.length + 100 });
      if (error) return NextResponse.json({ ok: false, code: error.message || 'RON_SIGNER_EVIDENCE_WRITE_REJECTED', partial: true }, { status: 409 });
    }

    const eventType = isCorrection ? 'RON_EVIDENCE_CORRECTED' : 'RON_EVIDENCE_RECORDED';
    await supabase.from('ron_audit_events').insert({
      matter_id: session.matter_id,
      ron_session_id: id,
      event_type: eventType,
      description: `${changes.length} RON evidence field(s) ${isCorrection ? 'corrected' : 'recorded'} by ${role}.${reason ? ` Reason: ${reason}` : ''}`,
      actor_id: userId,
      actor_role: role,
      source: 'milano_seal',
      metadata: { changes, reason: reason || null, lifecycle },
    });
    await appendMatterEvidence({
      matterId: session.matter_id,
      eventType,
      domain: 'ron',
      actorType: 'operator',
      actorId: userId,
      source: 'dashboard_ron_evidence',
      sourceReference: id,
      priorValue: changes.map((c) => ({ scope: c.scope, field: c.field, value: c.prior })),
      newValue: changes.map((c) => ({ scope: c.scope, field: c.field, value: c.next })),
      reason: reason || null,
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, event_type: eventType, changes: changes.length });
  } catch (error) {
    const failure = ronRouteError(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}
