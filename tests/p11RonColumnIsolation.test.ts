import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20261108140000_p11_ron_column_isolation.sql", "utf8");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

test("P11 clients cannot read raw provider payloads, signing URLs or evidence references", () => {
  const grants = migration.match(/grant select \(([^)]*)\)\s+on public\.(ron_sessions|ron_signers|ron_documents)/g) ?? [];
  assert.equal(grants.length, 3);
  for (const forbidden of ["raw_session", "signing_url_encrypted", "email", "phone", "journal_reference", "av_recording_reference",
    "kba_reference", "identity_proofing_reference", "evidence_verified_by", "exception_reason", "signed_storage_path", "storage_path", "notary_commission_number"]) {
    for (const grant of grants) assert.doesNotMatch(grant, new RegExp(`\\b${forbidden}\\b`), `${forbidden} must stay service-role only`);
  }
  assert.match(migration, /revoke select on public\.ron_sessions from authenticated/);
  assert.match(migration, /revoke insert, update, delete on public\.ron_sessions, public\.ron_signers, public\.ron_documents, public\.ron_audit_events from anon, authenticated/);
});

test("P11 no browser/user-scoped client reads RON tables directly", () => {
  for (const file of [...walk("app"), ...walk("components"), ...walk("lib")]) {
    const source = readFileSync(file, "utf8");
    if (!/from\(['"]ron_(sessions|signers|documents)['"]\)/.test(source)) continue;
    assert.ok(/createAdminClient|SupabaseClient|type Admin|supabase: Admin/.test(source), `${file} must read RON tables through the server/service role`);
    assert.doesNotMatch(source, /createBrowserClient/, `${file} must not use a browser client for RON tables`);
  }
});

test("P11 no service-role or provider secret is referenced from client components", () => {
  for (const file of [...walk("components"), ...walk("app")].filter((f) => f.endsWith(".tsx"))) {
    const source = readFileSync(file, "utf8");
    if (!/^["']use client["']/.test(source.trimStart())) continue;
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|WISE_API|BLUENOTARY_API|RESEND_API_KEY|RESEND_WEBHOOK_SECRET/, file);
  }
});
