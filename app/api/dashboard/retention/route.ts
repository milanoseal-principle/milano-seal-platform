import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { readAllKeyset } from '@/lib/data/keyset';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { RETENTION_DELETION_AUTHORITY_ROLES } from '@/lib/ron/governance';
import { ronRouteError } from '@/lib/ron/evidenceServer';

export const runtime = 'nodejs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRIVATE = { 'Cache-Control': 'private, no-store' };
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: PRIVATE });

export async function GET(request: NextRequest) {
  try {
    await requireDashboardAccess();
    const matterId = request.nextUrl.searchParams.get('matter_id') ?? '';
    if (!UUID.test(matterId)) return reply({ ok: false, code: 'MATTER_ID_REQUIRED' }, 422);
    const admin = createAdminClient({ timeoutMs: 15_000 });
    type Row = Record<string, unknown> & { id: string };
    const [records, holds, events, history] = await Promise.all([
      readAllKeyset<Row>(async cursor => {
        let query = admin.from('retention_records').select('*').eq('matter_id', matterId).order('id').limit(250);
        if (cursor) query = query.gt('id', cursor.id);
        const result = await query;
        if (result.error) throw Error('RETENTION_READ_UNAVAILABLE');
        return result.data as Row[] ?? [];
      }, row => row.id),
      readAllKeyset<Row>(async cursor => {
        let query = admin.from('retention_holds').select('*').eq('matter_id', matterId).order('id').limit(250);
        if (cursor) query = query.gt('id', cursor.id);
        const result = await query;
        if (result.error) throw Error('RETENTION_READ_UNAVAILABLE');
        return result.data as Row[] ?? [];
      }, row => row.id),
      readAllKeyset<Row>(async cursor => {
        let query = admin.from('retention_deletion_events').select('*,retention_records!inner(matter_id)').eq('retention_records.matter_id', matterId).order('id').limit(250);
        if (cursor) query = query.gt('id', cursor.id);
        const result = await query;
        if (result.error) throw Error('RETENTION_HISTORY_UNAVAILABLE');
        return result.data as Row[] ?? [];
      }, row => row.id),
      readAllKeyset<Row>(async cursor => {
        let query = admin.from('audit_events').select('id,event_type,actor_id,metadata,created_at').like('event_type', 'RETENTION_HOLD_%').contains('metadata', { matter_id: matterId }).order('id').limit(250);
        if (cursor) query = query.gt('id', cursor.id);
        const result = await query;
        if (result.error) throw Error('RETENTION_HISTORY_UNAVAILABLE');
        return result.data as Row[] ?? [];
      }, row => row.id),
    ]);
    return reply({ ok: true, records, holds, deletion_events: events, hold_history: history });
  } catch (error) {
    const failure = ronRouteError(error);
    return reply(failure.body, failure.status);
  }
}

// No destructive request is made until the canonical database claim commits.
// A timeout, ambiguous response or failed final persistence requires reconciliation.
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('origin') !== request.nextUrl.origin || !request.headers.get('content-type')?.startsWith('application/json')) return reply({ ok: false, code: 'SAME_ORIGIN_JSON_REQUIRED' }, 403);
    const { userId, role } = await requireDashboardAccess();
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const action = String(body.action ?? '');
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
    const id = String(['place_hold', 'approve_class'].includes(action) ? body.matter_id ?? '' : action === 'release_hold' ? body.hold_id ?? '' : body.retention_record_id ?? '');
    if (!UUID.test(id) || !reason) return reply({ ok: false, code: 'TARGET_AND_REASON_REQUIRED' }, 422);
    if (!['place_hold', 'release_hold', 'nominate', 'authorize', 'execute', 'reconcile', 'approve_class', 'resolve_record'].includes(action)) return reply({ ok: false, code: 'INVALID_ACTION' }, 422);
    if (!['place_hold', 'nominate'].includes(action) && !RETENTION_DELETION_AUTHORITY_ROLES.has(role)) return reply({ ok: false, code: 'DELETION_AUTHORITY_REQUIRED' }, 403);
    const admin = createAdminClient({ timeoutMs: 15_000 });
    const command = (operation: string, commandBody: Record<string, unknown>) => admin.rpc('retention_command', { p_actor: userId, p_operation: operation, p_id: id, p_body: commandBody });
    if (action !== 'execute') {
      const result = await command(action, { ...body, reason });
      if (result.error) return reply({ ok: false, code: 'RETENTION_ACTION_NOT_CONFIRMED', retry_safe: false }, result.error.code === '42501' ? 403 : 409);
      return reply(result.data, result.data?.ok ? 200 : 409);
    }
    // DELETION_AUTHORIZATION_MISSING is enforced under the Matter lock by the RPC.
    const claim = await command('claim', { reason, provider_deletion_evidence_ref: body.provider_deletion_evidence_ref });
    if (claim.error || !claim.data?.ok || !claim.data?.claim_id) return reply({ ok: false, code: 'RETENTION_DELETION_BLOCKED', blockers: claim.data?.blockers ?? [], retry_safe: false }, 409);
    const claimId = String(claim.data.claim_id);
    const reference = String(claim.data.record_reference);
    let outcome: 'deleted' | 'unknown' = 'unknown';
    let result: Record<string, unknown> = { method: 'unknown', code: 'DELETION_OUTCOME_UNKNOWN' };
    if (reference.startsWith('storage:')) {
      const [bucket, ...rest] = reference.slice('storage:'.length).split('/');
      const path = rest.join('/');
      if (bucket && path && !path.split('/').includes('..')) {
        try {
          const removed = await admin.storage.from(bucket).remove([path]);
          if (!removed.error && removed.data?.some(object => object.name === path)) {
            outcome = 'deleted';
            result = { method: 'storage_object_purge', bucket, path, evidence_reference: `storage-delete:${claimId}` };
          }
        } catch { /* Keep the persisted claim; uncertain outcomes are never retried automatically. */ }
      }
    } else {
      const evidence = typeof body.provider_deletion_evidence_ref === 'string' ? body.provider_deletion_evidence_ref.trim() : '';
      if (evidence) {
        outcome = 'deleted';
        result = { method: 'provider_confirmed_deletion', evidence_reference: evidence };
      } else result = { method: 'provider', code: 'PROVIDER_DELETION_EVIDENCE_REQUIRED' };
    }
    const finished = await command('finish', { reason, claim_id: claimId, outcome, result });
    if (finished.error || !finished.data?.ok || outcome === 'unknown') return reply({ ok: false, code: 'RETENTION_RECONCILIATION_REQUIRED', claim_id: claimId, retry_safe: false }, 409);
    return reply(finished.data);
  } catch (error) {
    if (ronRouteError(error).status === 401) return reply({ ok: false, code: 'UNAUTHORIZED' }, 401);
    return reply({ ok: false, code: 'RETENTION_STATE_UNKNOWN_RELOAD_BEFORE_RETRY', retry_safe: false }, 503);
  }
}
