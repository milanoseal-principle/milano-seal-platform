import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ESTIMATE_NOTICE,
  composeEstimatedTimeline,
  effectiveConfidence,
  evaluateProcessingAdvisory,
  type ProcessingObservation,
} from "@/lib/intelligence/execution-brain/processingAdvisory";
import {
  diffSourceFacts,
  extractSourceFacts,
  runAuthorityMonitor,
  type SourceFetcher,
} from "@/lib/intelligence/execution-brain/authorityMonitor";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const migration = read("supabase/migrations/087_authority_processing_intelligence.sql");
const NOW = new Date("2026-09-25T12:00:00Z");

const observation = (overrides: Partial<ProcessingObservation> = {}): ProcessingObservation => ({
  id: "obs-1",
  authority_id: "auth-fl",
  service_type: "apostille",
  source_url: "https://dos.fl.gov/sunbiz/certification/apostille/",
  source_title: "Apostille processing",
  source_date: "2026-09-20",
  observed_processing_date: "2026-09-10",
  estimated_days: 12,
  observation_method: "official_source",
  confidence: "VERIFIED_SOURCE",
  observed_at: "2026-09-21T00:00:00Z",
  expires_at: "2026-10-21T00:00:00Z",
  operator_override: false,
  override_reason: null,
  verified_by: "op-1",
  ...overrides,
});

test("expired observation → STALE (no advisory days)", () => {
  const advisory = evaluateProcessingAdvisory([observation({ expires_at: "2026-09-24T00:00:00Z" })], { now: NOW });
  assert.equal(advisory.status, "STALE");
  assert.equal(advisory.estimatedDays, null);
  assert.equal(advisory.reviewRequired, true);
  assert.match(migration, /expires_at timestamptz not null/);
  assert.match(migration, /expires_at > observed_at and expires_at <= observed_at \+ interval '120 days'/);
});

test("missing official source → LOW_CONFIDENCE / review", () => {
  const thirdParty = evaluateProcessingAdvisory([observation({ source_url: "https://apostille-blog.com/fl-times" })], { now: NOW });
  assert.equal(thirdParty.status, "LOW_CONFIDENCE");
  assert.equal(thirdParty.reviewRequired, true);
  assert.equal(thirdParty.officialSource, null);
  assert.equal(effectiveConfidence(observation({ source_url: null })), "LOW_CONFIDENCE");
  assert.equal(evaluateProcessingAdvisory([], { now: NOW }).status, "NONE");
  assert.match(migration, /confidence <> 'VERIFIED_SOURCE' or \(\s*source_url is not null/);
});

test("fresh verified observation → usable advisory with required fields", () => {
  const advisory = evaluateProcessingAdvisory(
    [observation(), observation({ id: "obs-2", confidence: "OBSERVED", observation_method: "observed_turnaround", estimated_days: 30, observed_at: "2026-09-22T00:00:00Z" })],
    { now: NOW, serviceType: "apostille" },
  );
  assert.equal(advisory.status, "CURRENT");
  assert.equal(advisory.observationId, "obs-1");
  assert.equal(advisory.estimatedDays, 12);
  assert.equal(advisory.officialSource, "https://dos.fl.gov/sunbiz/certification/apostille/");
  assert.equal(advisory.expiresAt, "2026-10-21T00:00:00Z");
  assert.equal(advisory.notice, "Estimate — not guaranteed.");
  // A pending official-source change still flags review.
  assert.equal(evaluateProcessingAdvisory([observation()], { now: NOW, pendingSourceReviews: 1 }).reviewRequired, true);
});

test("source content change → authority review event (classified), baseline first", async () => {
  const v1 = `<html><body><p>Fee: $10.00 per document.</p><p>Mail to P.O. Box 6800, Tallahassee, FL 32314</p><p>Currently processing requests received September 10, 2026.</p><a href="/media/1-form-10-19-2023.pdf">Form</a></body></html>`;
  const v2 = v1.replace("$10.00", "$12.00").replace("September 10, 2026", "September 18, 2026");
  assert.deepEqual(diffSourceFacts(extractSourceFacts(v1, "text/html"), extractSourceFacts(v1, "text/html")), []);
  assert.deepEqual(diffSourceFacts(extractSourceFacts(v1, "text/html"), extractSourceFacts(v2, "text/html")), ["fee_change", "processing_date_change"]);
  const v3 = v1.replace("1-form-10-19-2023.pdf", "1-form-01-05-2026.pdf");
  assert.deepEqual(diffSourceFacts(extractSourceFacts(v1, "text/html"), extractSourceFacts(v3, "text/html")), ["form_version_change"]);
  const v4 = v1.replace("P.O. Box 6800", "P.O. Box 7000");
  assert.ok(diffSourceFacts(extractSourceFacts(v1, "text/html"), extractSourceFacts(v4, "text/html")).includes("submission_address_change"));
  const v5 = v1.replace("</body>", "<p>Offices closed Friday.</p></body>");
  assert.deepEqual(diffSourceFacts(extractSourceFacts(v1, "text/html"), extractSourceFacts(v5, "text/html")), ["authority_notice_change"]);
  const pdfA = extractSourceFacts(new Uint8Array([1, 2, 3]), "application/pdf");
  const pdfB = extractSourceFacts(new Uint8Array([1, 2, 4]), "application/pdf");
  assert.deepEqual(diffSourceFacts(pdfA, pdfB), ["form_version_change"]);

  // Monitor run against an in-memory store.
  const tables: Record<string, Record<string, unknown>[]> = { authority_source_snapshots: [], authority_review_required: [], state_authorities: [] };
  const writes: string[] = [];
  const db = {
    from(table: string) {
      const filters: Array<[string, unknown]> = [];
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => (filters.push([column, value]), query),
        order: () => query,
        limit: () => query,
        maybeSingle: async () => {
          const rows = (tables[table] ?? []).filter((row) => filters.every(([c, v]) => row[c] === v));
          return { data: rows.at(-1) ?? null, error: null };
        },
        insert: async (row: Record<string, unknown>) => (writes.push(`insert:${table}`), tables[table].push(row), { error: null }),
        upsert: async (row: Record<string, unknown>) => (writes.push(`upsert:${table}`), tables[table].push(row), { error: null }),
        update: () => { writes.push(`update:${table}`); return query; },
      };
      return query;
    },
  };
  let body = v1;
  const fetcher: SourceFetcher = async () => ({ status: 200, contentType: "text/html", body });
  const targets = [{ authorityId: "auth-fl", sourceUrl: "https://dos.fl.gov/sunbiz/certification/apostille/" }];
  const first = await runAuthorityMonitor(db as never, targets, fetcher);
  assert.equal(first.baselined, 1);
  assert.equal(tables.authority_review_required.length, 0);
  const second = await runAuthorityMonitor(db as never, targets, fetcher);
  assert.equal(second.unchanged, 1);
  body = v2;
  const third = await runAuthorityMonitor(db as never, targets, fetcher);
  assert.equal(third.reviewsCreated, 1);
  const review = tables.authority_review_required[0];
  assert.equal(review.review_status, "PENDING");
  assert.deepEqual(review.change_detected, ["fee_change", "processing_date_change"]);
  assert.notEqual(review.previous_snapshot_hash, review.new_snapshot_hash);

  // Change does not alter canonical authority automatically.
  assert.ok(writes.every((w) => /authority_source_snapshots|authority_review_required/.test(w)), writes.join(","));
  assert.ok(!writes.some((w) => w.startsWith("update")));
});

test("monitor watches official sources only", async () => {
  const fetched: string[] = [];
  const fetcher: SourceFetcher = async (url) => (fetched.push(url), { status: 200, contentType: "text/html", body: "x" });
  const result = await runAuthorityMonitor(
    { from: () => { throw new Error("no db access expected"); } } as never,
    [{ authorityId: "a", sourceUrl: "https://apostille-helpers.com/florida" }],
    fetcher,
  );
  assert.deepEqual(fetched, []);
  assert.equal(result.skipped[0].reason, "NON_OFFICIAL_SOURCE");
  const lib = read("lib/intelligence/execution-brain/authorityMonitor.ts");
  assert.doesNotMatch(lib, /puppeteer|playwright/i);
  assert.doesNotMatch(lib, /from\("state_authorities"\)\.(update|upsert|insert)|authority_processing_observations"\)\.(update|insert)/);
});

test("operator approval required: decisions are operator-only and never touch canonical authority", () => {
  const start = migration.indexOf("function public.decide_authority_review");
  const block = migration.slice(start, migration.indexOf("$$;", start));
  assert.doesNotMatch(block, /state_authorities|authority_source_assets|authority_processing_observations/);
  assert.match(block, /EVIDENCE_NOTE_REQUIRED/);
  assert.match(block, /review_status = 'PENDING'/);
  assert.match(migration, /revoke all on function public\.decide_authority_review[^;]*from public, anon, authenticated/);
  const route = read("app/api/dashboard/authority-reviews/[id]/route.ts");
  assert.match(route, /WRITE_ROLES\.has\(role\)/);
  assert.match(route, /decide_authority_review/);
  assert.doesNotMatch(route, /state_authorities/);
  const observations = read("app/api/dashboard/state-authorities/[id]/processing-observations/route.ts");
  assert.doesNotMatch(observations, /body\.confidence/);
  assert.match(observations, /method === "official_source" && isOfficialGovernmentSource\(sourceUrl\) && sourceDate/);
});

test("no guaranteed completion date emitted; timeline is durations only", () => {
  const timeline = composeEstimatedTimeline({
    outboundCarrierDays: 2,
    advisory: { status: "CURRENT", estimatedDays: 12 },
    returnCarrierDays: 3,
    returnRequired: true,
  });
  assert.equal(timeline.totalEstimatedDays, 17);
  assert.equal(timeline.notice, ESTIMATE_NOTICE);
  const serialized = JSON.stringify(timeline);
  assert.doesNotMatch(serialized, /\d{4}-\d{2}-\d{2}|guarantee(d)? (completion|date)|completionDate|completes on/i);
  const partial = composeEstimatedTimeline({ outboundCarrierDays: null, advisory: { status: "STALE", estimatedDays: null }, returnCarrierDays: null, returnRequired: false });
  assert.equal(partial.totalEstimatedDays, null);
  assert.equal(partial.complete, false);
  for (const file of [
    "lib/intelligence/execution-brain/processingAdvisory.ts",
    "components/dashboard/execution/AuthorityAdvisoryPanel.tsx",
  ]) {
    const code = read(file).split("\n").filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line)).join("\n");
    assert.doesNotMatch(code, /guaranteed completion|will be completed by|completion date/i, file);
  }
  const panel = read("components/dashboard/execution/AuthorityAdvisoryPanel.tsx");
  for (const label of ["Current advisory", "Estimated days", "Official source", "Observed date", "Last verified", "Confidence", "Expiration", "Estimated Timeline", "Current Authority Advisory"]) {
    assert.ok(panel.includes(label), label);
  }
  assert.match(panel, /ESTIMATE_NOTICE/);
});

test("no hardcoded permanent wait times", () => {
  for (const file of [
    "lib/intelligence/execution-brain/processingAdvisory.ts",
    "lib/intelligence/execution-brain/authorityMonitor.ts",
    "supabase/migrations/087_authority_processing_intelligence.sql",
    "components/dashboard/execution/AuthorityAdvisoryPanel.tsx",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /(Florida|New York|Texas|\bFL\b|\bNY\b|\bTX\b)\s*[:=]\s*\d+/, file);
    assert.doesNotMatch(source, /insert into public\.authority_processing_observations/, file);
  }
});
