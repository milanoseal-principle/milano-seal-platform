import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Regression: the upload routes write files.filename / file_path (and file_url) but the hosted
// files table was created without them (read-only P12 catalogs, 2026-11-09 and 2026-11-12),
// so every upload insert was rejected in production while isolated suites, which replay the
// repository schema, passed. The fixture is the hosted table's exact 20 columns.

const MIGRATION = fs.readFileSync("supabase/migrations/20261112100000_files_upload_compatibility_columns.sql", "utf8");
const HOSTED_FILES = `create table public.files(
  id uuid primary key default gen_random_uuid(), deal_id uuid not null, name text not null, storage_path text not null,
  category text, certification_signature_detected bool not null, created_at timestamptz default now(), encryption_detected bool not null,
  file_size int8, file_type text, is_internal bool, mime_type text, preflight_checked_at timestamptz, preflight_scanner_version text,
  sha256 text, signature_detected bool not null, size_bytes int8, structural_review_reason text, structural_status text, uploaded_by text)`;
const PREFLIGHT = ["sha256", "signature_detected", "certification_signature_detected", "encryption_detected", "structural_status", "structural_review_reason", "preflight_scanner_version", "preflight_checked_at"];
const ROUTES = ["app/api/upload/route.ts", "app/api/intake/upload/route.ts", "app/api/portal/me/upload/route.ts"];

// The exact top-level keys each route inserts into files, read from source.
function insertedColumns(file: string): string[] {
  const source = fs.readFileSync(file, "utf8");
  const at = source.search(/\.from\(\s*["']files["']\s*\)\s*\.insert\(\s*\{/);
  assert.ok(at >= 0, `${file} inserts into files`);
  const body = source.slice(source.indexOf("{", source.indexOf(".insert(", at)) + 1);
  const end = body.indexOf("})");
  const keys = [...body.slice(0, end).matchAll(/^\s*(\w+)\s*[:,]/gm)].map((m) => m[1]);
  if (body.slice(0, end).includes("...preflightColumns(")) keys.push(...PREFLIGHT);
  return [...new Set(keys)];
}

const sample: Record<string, unknown> = {
  deal_id: "00000000-0000-4000-8000-000000000001", name: "synthetic.pdf", filename: "synthetic.pdf", storage_path: "simulation/x.pdf",
  file_path: "simulation/x.pdf", file_url: null, file_type: "application/pdf", mime_type: "application/pdf", file_size: 10, size_bytes: 10,
  category: "client-upload", uploaded_by: "client", sha256: "a".repeat(64), signature_detected: false, certification_signature_detected: false,
  encryption_detected: false, structural_status: "READY", structural_review_reason: null, preflight_scanner_version: "v1", preflight_checked_at: new Date().toISOString(),
};
const insert = (db: PGlite, columns: string[]) =>
  db.query(`insert into public.files(${columns.join(",")}) values(${columns.map((_, i) => `$${i + 1}`).join(",")})`, columns.map((c) => sample[c]));

for (const route of ROUTES) {
  test(`${route}: insert is rejected by the hosted table shape and accepted after the migration`, async () => {
    const columns = insertedColumns(route);
    for (const c of columns) assert.ok(c in sample, `fixture value for ${c}`);
    const db = new PGlite();
    await db.exec(HOSTED_FILES);
    await assert.rejects(() => insert(db, columns), /column "(filename|file_path|file_url)" .*does not exist/);
    await db.exec(MIGRATION);
    await insert(db, columns);
    assert.equal((await db.query<{ n: number }>("select count(*)::int n from public.files")).rows[0].n, 1);
    await db.close();
  });
}

test("migration is additive, idempotent and touches only files", async () => {
  const db = new PGlite();
  await db.exec(HOSTED_FILES);
  await db.exec(MIGRATION);
  await db.exec(MIGRATION);
  await db.close();
  const statements = MIGRATION.replace(/--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);
  assert.deepEqual(statements, [
    "alter table public.files add column if not exists filename text",
    "alter table public.files add column if not exists file_path text",
    "alter table public.files add column if not exists file_url text",
  ]);
});

test("production build preflight requires the upload write contract", () => {
  // Read from source: the preflight module uses top-level await, which tsx cannot import here.
  const preflight = fs.readFileSync("scripts/verify-production-schema-capabilities.mjs", "utf8");
  const requiredFiles = [...(preflight.match(/^\s*files:\s*\[([^\]]*)\]/m)?.[1] ?? "").matchAll(/'(\w+)'/g)].map((m) => m[1]);
  assert.ok(requiredFiles.includes("filename") && requiredFiles.includes("file_path") && requiredFiles.includes("file_url"));
  for (const route of ROUTES) for (const c of insertedColumns(route).filter((c) => !PREFLIGHT.includes(c))) {
    assert.ok(requiredFiles.includes(c) || ["file_type", "file_size", "category", "uploaded_by"].includes(c), `${route}: ${c} guarded`);
  }
});
