import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { User } from '@supabase/supabase-js';
import { resolveServerRole } from '../../lib/auth/server-role';

const session: User = { id: 'operator-id', app_metadata: { role: 'admin_operator' }, user_metadata: {}, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z' };
const result = (user: User | null, error: unknown = null) => async () => ({ data: { user }, error });

test('authoritative disable, removal and demotion override a stale privileged session', async () => {
  for (const metadata of [{ role: 'admin_operator', disabled: true }, {}, { role: '' }]) {
    assert.equal(await resolveServerRole(session, result({ ...session, app_metadata: metadata })), '');
  }
  assert.equal(await resolveServerRole(session, result({ ...session, app_metadata: { role: 'client' } })), 'client');
});

test('deleted, banned and mismatched identities cannot inherit a session role', async () => {
  assert.equal(await resolveServerRole(session, result(null)), '');
  assert.equal(await resolveServerRole(session, result({ ...session, id: 'another-user' })), '');
  for (const banned_until of ['2999-01-01T00:00:00Z', 'invalid']) {
    assert.equal(await resolveServerRole(session, result({ ...session, banned_until } as User)), '');
  }
});

test('lookup errors and outages fail closed; successful current roles remain available', async () => {
  assert.equal(await resolveServerRole(session, result(null, new Error('unavailable'))), '');
  assert.equal(await resolveServerRole(session, async () => { throw new Error('offline'); }), '');
  assert.equal(await resolveServerRole(session, result(session)), 'admin_operator');
  assert.equal(await resolveServerRole({ ...session, app_metadata: { disabled: true } }, result(session)), '');
});
