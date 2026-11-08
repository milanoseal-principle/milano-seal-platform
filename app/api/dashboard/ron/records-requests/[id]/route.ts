import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { appendLedger, CUSTODY_EVENTS } from '@/lib/custodyLedger';
import { RECORDS_REQUEST_DECISION_ROLES, recordsReleaseBlockers } from '@/lib/ron/governance';
import { ronRouteError } from '@/lib/ron/evidenceServer';

export const runtime = 'nodejs';

// POST /api/dashboard/ron/records-requests/[id]
// verify_requester | decide | set_redaction | release — each appends an event; release is exact-version and custody-linked.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action ?? '');
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 2000) : '';
    const supabase = createAdminClient();
    const { data: req } = await supabase.from('ron_records_requests').select('*').eq('id', id).maybeSingle();
    if (!req) return NextResponse.json({ ok: false, code: 'REQUEST_NOT_FOUND' }, { status: 404 });
    if (req.released_at && action !== 'close') return NextResponse.json({ ok: false, code: 'ALREADY_RELEASED' }, { status: 409 });

    let update: Record<string, unknown> = {};
    let metadata: Record<string, unknown> = {};

    if (action === 'verify_requester') {
      const state = String(body.state ?? '');
      const evidence = typeof body.evidence_ref === 'string' ? body.evidence_ref.trim() : '';
      if (!['verified', 'failed'].includes(state) || !evidence) return NextResponse.json({ ok: false, code: 'VERIFICATION_EVIDENCE_REQUIRED' }, { status: 422 });
      update = { requester_verification_state: state, requester_verification_evidence_ref: evidence, review_status: 'in_review' };
    } else if (action === 'decide') {
      if (!RECORDS_REQUEST_DECISION_ROLES.has(role)) return NextResponse.json({ ok: false, code: 'DECISION_AUTHORITY_REQUIRED' }, { status: 403 });
      const decision = String(body.decision ?? '');
      if (!['approved', 'denied'].includes(decision) || !reason) return NextResponse.json({ ok: false, code: 'DECISION_AND_REASON_REQUIRED' }, { status: 422 });
      if (decision === 'approved' && req.requester_verification_state !== 'verified') {
        return NextResponse.json({ ok: false, code: 'REQUESTER_NOT_VERIFIED' }, { status: 409 });
      }
      update = { decision, decision_reason: reason, decided_by: userId, decided_at: new Date().toISOString(), review_status: decision === 'denied' ? 'closed' : 'decided' };
    } else if (action === 'set_redaction') {
      const status = String(body.redaction_status ?? '');
      if (!['not_required', 'required', 'completed'].includes(status) || !reason) return NextResponse.json({ ok: false, code: 'REDACTION_STATUS_AND_REASON_REQUIRED' }, { status: 422 });
      update = { redaction_status: status };
    } else if (action === 'release') {
      const versionId = String(body.release_document_version_id ?? '');
      const { data: version } = await supabase.from('document_versions').select('id, matter_id, file_hash, storage_path').eq('id', versionId).maybeSingle();
      const sha = String(version?.file_hash ?? '');
      const blockers = recordsReleaseBlockers(req, version ?? null, sha);
      if (blockers.length > 0) return NextResponse.json({ ok: false, code: 'RECORDS_RELEASE_BLOCKED', blockers }, { status: 409 });
      const custody = await appendLedger({
        deal_id: req.matter_id,
        event: CUSTODY_EVENTS.DOC_HANDOFF,
        actor_type: 'operator',
        actor_id: userId,
        status: 'RON_RECORDS_RELEASED',
        notes: 'Governed RON records-request release of an exact document version.',
        metadata: { records_request_id: id, document_version_id: versionId, sha256: sha },
      });
      if (!custody?.hash) return NextResponse.json({ ok: false, code: 'CUSTODY_APPEND_FAILED', retry_safe: true }, { status: 502 });
      update = {
        release_document_version_id: versionId, release_sha256: sha, release_custody_hash: custody.hash,
        released_at: new Date().toISOString(), released_by: userId, review_status: 'released',
      };
      metadata = { document_version_id: versionId, sha256: sha, custody_hash: custody.hash };
    } else {
      return NextResponse.json({ ok: false, code: 'INVALID_ACTION' }, { status: 422 });
    }

    const { data: updated, error } = await supabase.from('ron_records_requests').update(update)
      .eq('id', id).eq('updated_at', req.updated_at).select('id').maybeSingle();
    if (error) return NextResponse.json({ ok: false, code: error.message }, { status: 409 });
    if (!updated) return NextResponse.json({ ok: false, code: 'STALE_RECORDS_REQUEST' }, { status: 409 });
    await supabase.from('ron_records_request_events').insert({
      request_id: id, matter_id: req.matter_id, event_type: `RECORDS_REQUEST_${action.toUpperCase()}`,
      actor_id: userId, actor_role: role, reason: reason || null, metadata: { ...metadata, update_fields: Object.keys(update) },
    });
    return NextResponse.json({ ok: true, action });
  } catch (error) {
    const failure = ronRouteError(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}
