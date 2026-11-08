import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { assertCanRetrieveSignedDocuments, RONGuardError } from '../lib/bluenotary/guards';

type Session = {
  milano_ron_status: string;
  ron_lifecycle_state: string;
  provider_completed_at?: string | null;
  provider_session_completed_at?: string | null;
  blue_notary_status?: string | null;
  evidence_reopened_at?: string | null;
};

function db(session: Session): SupabaseClient {
  const chain = {
    single: async () => ({ data: { id: 'ron-1', ...session }, error: null }),
  };
  return {
    from: () => ({
      select: () => ({
        eq: () => chain,
      }),
    }),
  } as unknown as SupabaseClient;
}
const attempt = (s: Session) => assertCanRetrieveSignedDocuments(db(s), 'ron-1');

test('SESSION_PROCESSING alone cannot authorize provider artifact retrieval', async () => {
  await assert.rejects(attempt({
    milano_ron_status: 'SESSION_PROCESSING',
    ron_lifecycle_state: 'STARTED',
    blue_notary_status: 'PROCESSING',
  }), (e: unknown) => e instanceof RONGuardError && e.code === 'SESSION_NOT_COMPLETED');
});

test('legacy RON_REVIEW_REQUIRED cannot bypass a governed reopen', async () => {
  await assert.rejects(attempt({
    milano_ron_status: 'RON_REVIEW_REQUIRED',
    ron_lifecycle_state: 'COMPLETED',
    provider_completed_at: '2026-11-08T08:00:00Z',
    blue_notary_status: 'COMPLETED',
    evidence_reopened_at: null,
  }), (e: unknown) => e instanceof RONGuardError && e.code === 'SESSION_NOT_COMPLETED');
});

test('legacy corrected document can be retrieved after actual provider completion and reopen', async () => {
  await attempt({
    milano_ron_status: 'RON_REVIEW_REQUIRED',
    ron_lifecycle_state: 'COMPLETED',
    provider_completed_at: '2026-11-08T08:00:00Z',
    blue_notary_status: 'COMPLETED',
    evidence_reopened_at: '2026-11-08T09:00:00Z',
  });
});

test('modern evidence-pending correction remains retrievable after provider completion', async () => {
  await attempt({
    milano_ron_status: 'RON_REVIEW_REQUIRED',
    ron_lifecycle_state: 'EVIDENCE_PENDING',
  });
});

test('expired or cancelled sessions do not retrieve executed documents', async () => {
  await assert.rejects(attempt({
    milano_ron_status: 'RON_EXPIRED', ron_lifecycle_state: 'EVIDENCE_PENDING',
  }), (e: unknown) => e instanceof RONGuardError && e.code === 'SESSION_NOT_COMPLETED');
  await assert.rejects(attempt({
    milano_ron_status: 'RON_REVIEW_REQUIRED',
    ron_lifecycle_state: 'CANCELLED',
    provider_completed_at: '2026-11-08T08:00:00Z',
    blue_notary_status: 'COMPLETED',
    evidence_reopened_at: '2026-11-08T09:00:00Z',
  }), (e: unknown) => e instanceof RONGuardError && e.code === 'SESSION_NOT_COMPLETED');
});
