import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { canAuthorizeDeletion, retentionDeletionBlockers, RETENTION_DELETION_AUTHORITY_ROLES } from '@/lib/ron/governance';
import { ronRouteError } from '@/lib/ron/evidenceServer';

export const runtime = 'nodejs';
const UUID = /^[0-9a-f-]{36}$/i;

// GET /api/dashboard/retention?matter_id=… — retention evidence, holds and deletion history for one Matter.
export async function GET(request: NextRequest) {
  try {
    await requireDashboardAccess();
    const matterId = request.nextUrl.searchParams.get('matter_id') ?? '';
    if (!UUID.test(matterId)) return NextResponse.json({ ok: false, code: 'MATTER_ID_REQUIRED' }, { status: 422 });
    const supabase = createAdminClient();
    const [records, holds] = await Promise.all([
      supabase.from('retention_records').select('*').eq('matter_id', matterId).order('created_at').limit(500),
      supabase.from('retention_holds').select('*').eq('matter_id', matterId).order('placed_at').limit(500),
    ]);
    const ids = (records.data ?? []).map((r) => r.id);
    const events = ids.length
      ? await supabase.from('retention_deletion_events').select('*').in('retention_record_id', ids).order('created_at').limit(1000)
      : { data: [] };
    return NextResponse.json({ ok: true, records: records.data ?? [], holds: holds.data ?? [], deletion_events: events.data ?? [] });
  } catch (error) {
    const failure = ronRouteError(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}

async function loadRecordState(supabase: ReturnType<typeof createAdminClient>, recordId: string) {
  const { data: record } = await supabase.from('retention_records').select('*').eq('id', recordId).maybeSingle();
  if (!record) return null;
  const [{ count: holds }, { data: session }, { count: requests }, { count: incidents }] = await Promise.all([
    supabase.from('retention_holds').select('id', { count: 'exact', head: true }).eq('matter_id', record.matter_id).is('released_at', null)
      .or(`retention_record_id.eq.${record.id},retention_record_id.is.null`),
    record.ron_session_id
      ? supabase.from('ron_sessions').select('ron_lifecycle_state').eq('id', record.ron_session_id).maybeSingle()
      : Promise.resolve({ data: null }),
    record.ron_session_id
      ? supabase.from('ron_records_requests').select('id', { count: 'exact', head: true }).eq('ron_session_id', record.ron_session_id).is('released_at', null).neq('decision', 'denied')
      : Promise.resolve({ count: 0 }),
    supabase.from('compliance_incidents').select('id', { count: 'exact', head: true }).eq('matter_id', record.matter_id)
      .not('status', 'in', '(CLOSED,RESOLVED,MATTER_RESTORED_OR_CLOSED)'),
  ]);
  return {
    record,
    state: {
      deletion_status: record.deletion_status,
      policy_status: record.policy_status,
      retention_until: record.retention_until,
      ...(record.ron_session_id ? { ron_lifecycle_state: session?.ron_lifecycle_state ?? null } : {}),
      active_holds: holds ?? 1,
      open_records_requests: requests ?? 1,
      open_incidents: incidents ?? 1,
    },
  };
}

// POST /api/dashboard/retention — place_hold | release_hold | nominate | authorize | execute.
// Deletion is fail-closed: active retention, holds, unresolved policy, dependencies or missing authority block it.
export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await requireDashboardAccess();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action ?? '');
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
    const supabase = createAdminClient();

    if (action === 'place_hold') {
      const matterId = String(body.matter_id ?? '');
      const holdType = String(body.hold_type ?? 'legal');
      if (!UUID.test(matterId) || !reason) return NextResponse.json({ ok: false, code: 'MATTER_AND_REASON_REQUIRED' }, { status: 422 });
      const { data, error } = await supabase.from('retention_holds').insert({
        matter_id: matterId,
        ron_session_id: typeof body.ron_session_id === 'string' ? body.ron_session_id : null,
        retention_record_id: typeof body.retention_record_id === 'string' ? body.retention_record_id : null,
        hold_type: holdType,
        reason,
        placed_by: userId,
      }).select('id').single();
      if (error) return NextResponse.json({ ok: false, code: 'HOLD_REJECTED' }, { status: 409 });
      return NextResponse.json({ ok: true, hold_id: data.id });
    }

    if (action === 'release_hold') {
      if (!RETENTION_DELETION_AUTHORITY_ROLES.has(role)) return NextResponse.json({ ok: false, code: 'HOLD_RELEASE_AUTHORITY_REQUIRED' }, { status: 403 });
      if (!reason) return NextResponse.json({ ok: false, code: 'REASON_REQUIRED' }, { status: 422 });
      const { data } = await supabase.from('retention_holds')
        .update({ released_by: userId, released_at: new Date().toISOString(), release_reason: reason })
        .eq('id', String(body.hold_id ?? '')).is('released_at', null).select('id').maybeSingle();
      return data ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, code: 'HOLD_NOT_ACTIVE' }, { status: 409 });
    }

    const recordId = String(body.retention_record_id ?? '');
    if (!UUID.test(recordId)) return NextResponse.json({ ok: false, code: 'RECORD_ID_REQUIRED' }, { status: 422 });
    const loaded = await loadRecordState(supabase, recordId);
    if (!loaded) return NextResponse.json({ ok: false, code: 'RECORD_NOT_FOUND' }, { status: 404 });
    const { record, state } = loaded;
    const logEvent = (stage: string, blockers: string[], result: Record<string, unknown> = {}) =>
      supabase.from('retention_deletion_events').insert({ retention_record_id: recordId, stage, actor_id: userId, actor_role: role, reason: reason || null, blockers, result });

    if (action === 'nominate' || action === 'authorize') {
      const blockers = action === 'authorize' ? canAuthorizeDeletion(role, state, reason) : retentionDeletionBlockers(state);
      if (blockers.length > 0) {
        await logEvent('denied', blockers);
        return NextResponse.json({ ok: false, code: 'RETENTION_DELETION_BLOCKED', blockers }, { status: 409 });
      }
      const update = action === 'nominate'
        ? { deletion_status: 'candidate' }
        : { deletion_status: 'authorized', deletion_authorized_by: userId, deletion_authorized_at: new Date().toISOString(), deletion_reason: reason };
      const { error } = await supabase.from('retention_records').update(update).eq('id', recordId).eq('deletion_status', record.deletion_status);
      if (error) {
        await logEvent('denied', [error.message]);
        return NextResponse.json({ ok: false, code: error.message }, { status: 409 });
      }
      await logEvent(action === 'nominate' ? 'candidate' : 'authorized', []);
      return NextResponse.json({ ok: true, deletion_status: update.deletion_status });
    }

    if (action === 'execute') {
      if (!RETENTION_DELETION_AUTHORITY_ROLES.has(role)) return NextResponse.json({ ok: false, code: 'DELETION_AUTHORITY_REQUIRED' }, { status: 403 });
      if (record.deletion_status !== 'authorized') return NextResponse.json({ ok: false, code: 'DELETION_AUTHORIZATION_MISSING' }, { status: 409 });
      const blockers = retentionDeletionBlockers(state);
      if (blockers.length > 0) {
        await logEvent('denied', blockers);
        return NextResponse.json({ ok: false, code: 'RETENTION_DELETION_BLOCKED', blockers }, { status: 409 });
      }
      let result: Record<string, unknown>;
      const reference = String(record.record_reference);
      if (reference.startsWith('storage:')) {
        const [bucket, ...rest] = reference.slice('storage:'.length).split('/');
        const { error } = await supabase.storage.from(bucket).remove([rest.join('/')]);
        if (error) {
          await logEvent('failed', ['STORAGE_DELETE_FAILED']);
          await supabase.from('retention_records').update({ deletion_status: 'failed', deletion_result: { error: 'STORAGE_DELETE_FAILED' } }).eq('id', recordId);
          return NextResponse.json({ ok: false, code: 'STORAGE_DELETE_FAILED', retry_safe: true }, { status: 502 });
        }
        result = { method: 'storage_object_purge', bucket, path: rest.join('/') };
      } else {
        // Provider-held records (journal, recording) require the provider's deletion confirmation as evidence.
        const evidence = typeof body.provider_deletion_evidence_ref === 'string' ? body.provider_deletion_evidence_ref.trim() : '';
        if (!evidence) return NextResponse.json({ ok: false, code: 'PROVIDER_DELETION_EVIDENCE_REQUIRED' }, { status: 422 });
        result = { method: 'provider_confirmed_deletion', provider_deletion_evidence_ref: evidence };
      }
      const { error } = await supabase.from('retention_records')
        .update({ deletion_status: 'deleted', deleted_by: userId, deleted_at: new Date().toISOString(), deletion_result: result })
        .eq('id', recordId).eq('deletion_status', 'authorized');
      if (error) {
        await logEvent('failed', [error.message], result);
        return NextResponse.json({ ok: false, code: error.message }, { status: 409 });
      }
      await logEvent('deleted', [], result);
      return NextResponse.json({ ok: true, deletion_status: 'deleted', result });
    }

    return NextResponse.json({ ok: false, code: 'INVALID_ACTION' }, { status: 422 });
  } catch (error) {
    const failure = ronRouteError(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}
