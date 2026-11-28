import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import {
  hashIntakeSubmissionPayload,
  hashIntakeSubmissionToken,
  runDurableIntakeSubmission,
  type DurableIntakeSubmissionStore,
  type IntakeSubmissionDecision,
  type StoredIntakeResponse,
} from "@/lib/intake/durableSubmissionIdempotency";

const migration = readFileSync("supabase/migrations/20261126100000_public_intake_idempotency.sql", "utf8");
const intakeCore = readFileSync("app/api/intake/core.ts", "utf8");
const token = "A".repeat(43);
const payload = { email: "client@example.com", country: "Italy", details: { signerCount: 1, docs: 1 } };
const body = { success: true, deal_id: "MS-2026-TEST", portal_url: "https://example.invalid/portal/secret" };

function responseFrom(data: unknown): Record<string, unknown> {
  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? {}) as Record<string, unknown>;
}

async function fixture() {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role;");
  await db.exec(migration);
  return db;
}

function pgStore(db: PGlite): DurableIntakeSubmissionStore {
  return {
    async lookup(tokenHash, payloadHash) {
      const row = responseFrom((await db.query("select * from public.lookup_intake_submission($1, $2)", [tokenHash, payloadHash])).rows);
      if (row.decision === "replay") {
        return {
          decision: "replay",
          response: {
            status: Number(row.response_status),
            body: row.response_body as Record<string, unknown>,
            dealId: typeof row.deal_id === "string" ? row.deal_id : null,
          },
        };
      }
      return { decision: String(row.decision) as IntakeSubmissionDecision["decision"] } as IntakeSubmissionDecision;
    },
    async claim(tokenHash, payloadHash) {
      const row = responseFrom((await db.query("select * from public.claim_intake_submission($1, $2)", [tokenHash, payloadHash])).rows);
      if (row.decision === "replay") {
        return {
          decision: "replay",
          response: {
            status: Number(row.response_status),
            body: row.response_body as Record<string, unknown>,
            dealId: typeof row.deal_id === "string" ? row.deal_id : null,
          },
        };
      }
      return { decision: String(row.decision) as IntakeSubmissionDecision["decision"] } as IntakeSubmissionDecision;
    },
    async complete(tokenHash, payloadHash, response) {
      const result = await db.query<{ completed: boolean }>(
        "select public.complete_intake_submission($1, $2, $3, $4::jsonb, $5) as completed",
        [tokenHash, payloadHash, response.status, JSON.stringify(response.body), response.dealId],
      );
      assert.equal(result.rows[0]?.completed, true);
    },
  };
}

class MemoryStore implements DurableIntakeSubmissionStore {
  readonly records = new Map<string, { payloadHash: string; state: "processing" | "completed"; response?: StoredIntakeResponse }>();

  async lookup(tokenHash: string, payloadHash: string): Promise<IntakeSubmissionDecision> {
    const record = this.records.get(tokenHash);
    if (!record) return { decision: "missing" };
    if (record.payloadHash !== payloadHash) return { decision: "conflict" };
    if (record.state === "completed" && record.response) return { decision: "replay", response: record.response };
    return { decision: "processing" };
  }

  async claim(tokenHash: string, payloadHash: string): Promise<IntakeSubmissionDecision> {
    const record = this.records.get(tokenHash);
    if (!record) {
      this.records.set(tokenHash, { payloadHash, state: "processing" });
      return { decision: "owner" };
    }
    if (record.payloadHash !== payloadHash) return { decision: "conflict" };
    if (record.state === "completed" && record.response) {
      return { decision: "replay", response: record.response };
    }
    return { decision: "processing" };
  }

  async complete(tokenHash: string, payloadHash: string, response: StoredIntakeResponse) {
    const record = this.records.get(tokenHash);
    assert.ok(record && record.payloadHash === payloadHash);
    this.records.set(tokenHash, { payloadHash, state: "completed", response });
  }
}

test("an error after Matter persistence retains its Matter ID for exact response replay", () => {
  assert.ok(intakeCore.includes("persistedDealId = (reviewDeal as { deal_id?: string })?.deal_id || deal_id;"));
  assert.ok(intakeCore.includes("persistedDealId = String(deal.deal_id || deal_id);"));
  assert.ok(intakeCore.includes("safeFailure(code, correlationId, 500, undefined, persistedDealId)"));
});

test("payload hashing is stable across object key order and token hashes never expose the token", () => {
  assert.equal(hashIntakeSubmissionPayload({ b: 2, a: 1 }), hashIntakeSubmissionPayload({ a: 1, b: 2 }));
  assert.equal(hashIntakeSubmissionToken(token).length, 64);
  assert.notEqual(hashIntakeSubmissionToken(token), token);
});

test("durable SQL claim keeps one reservation and exact replays return the original response", async () => {
  const db = await fixture();
  try {
    const keyHash = hashIntakeSubmissionToken(token);
    const payloadHash = hashIntakeSubmissionPayload(payload);
    const decisions = await Promise.all(
      Array.from({ length: 12 }, async () => responseFrom((await db.query(
        "select * from public.claim_intake_submission($1, $2)", [keyHash, payloadHash],
      )).rows).decision),
    );
    assert.equal(decisions.filter((decision) => decision === "owner").length, 1);
    assert.equal(decisions.filter((decision) => decision === "processing").length, 11);

    const completed = await db.query<{ completed: boolean }>(
      "select public.complete_intake_submission($1, $2, 200, $3::jsonb, $4) as completed",
      [keyHash, payloadHash, JSON.stringify(body), body.deal_id],
    );
    assert.equal(completed.rows[0]?.completed, true);
    const replay = responseFrom((await db.query(
      "select * from public.lookup_intake_submission($1, $2)", [keyHash, payloadHash],
    )).rows);
    assert.equal(replay.decision, "replay");
    assert.equal(replay.response_status, 200);
    assert.deepEqual(replay.response_body, body);
    assert.equal(replay.deal_id, body.deal_id);
    assert.equal((await db.query<{ count: number }>("select count(*)::int as count from public.intake_submission_idempotency")).rows[0]?.count, 1);
  } finally {
    await db.close();
  }
});

test("same token with changed payload conflicts without changing its reservation", async () => {
  const db = await fixture();
  try {
    const keyHash = hashIntakeSubmissionToken(token);
    const firstHash = hashIntakeSubmissionPayload(payload);
    const changedHash = hashIntakeSubmissionPayload({ ...payload, country: "France" });
    await db.query("select * from public.claim_intake_submission($1, $2)", [keyHash, firstHash]);
    const conflict = responseFrom((await db.query("select * from public.claim_intake_submission($1, $2)", [keyHash, changedHash])).rows);
    assert.equal(conflict.decision, "conflict");
    assert.equal((await db.query<{ count: number }>("select count(*)::int as count from public.intake_submission_idempotency")).rows[0]?.count, 1);
  } finally {
    await db.close();
  }
});

test("completed response expires after 30 days but the tombstone prevents a second Matter", async () => {
  const db = await fixture();
  try {
    const keyHash = hashIntakeSubmissionToken(token);
    const payloadHash = hashIntakeSubmissionPayload(payload);
    await db.query("select * from public.claim_intake_submission($1, $2)", [keyHash, payloadHash]);
    await db.query("select public.complete_intake_submission($1, $2, 200, $3::jsonb, $4)", [keyHash, payloadHash, JSON.stringify(body), body.deal_id]);
    await db.query("update public.intake_submission_idempotency set completed_at = now() - interval '31 days' where token_hash = $1", [keyHash]);
    const expired = responseFrom((await db.query("select * from public.lookup_intake_submission($1, $2)", [keyHash, payloadHash])).rows);
    assert.equal(expired.decision, "expired");
    const second = responseFrom((await db.query("select * from public.claim_intake_submission($1, $2)", [keyHash, payloadHash])).rows);
    assert.equal(second.decision, "expired");
    assert.equal((await db.query<{ count: number }>("select count(*)::int as count from public.intake_submission_idempotency")).rows[0]?.count, 1);
  } finally {
    await db.close();
  }
});

test("a saved uncertain response with a Matter ID is replayed without rerunning the executor", async () => {
  const store = new MemoryStore();
  let sideEffectCount = 0;
  const savedResponse: StoredIntakeResponse = {
    status: 500,
    body: { success: false, code: "UNKNOWN_INTAKE_FAILURE", deal_id: "MS-2026-SAVED", error: "Matter saved; contact support." },
    dealId: "MS-2026-SAVED",
  };
  const execute = async () => {
    sideEffectCount += 1;
    return savedResponse;
  };

  const first = await runDurableIntakeSubmission(store, token, payload, execute);
  const retry = await runDurableIntakeSubmission(store, token, payload, execute);
  assert.deepEqual(first, { decision: "replay", response: savedResponse });
  assert.deepEqual(retry, first);
  assert.equal(sideEffectCount, 1);
});

test("concurrent service calls execute once and recover the exact saved response", async () => {
  const store = new MemoryStore();
  let sideEffectCount = 0;
  const execute = async (): Promise<StoredIntakeResponse> => {
    sideEffectCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { status: 200, body, dealId: body.deal_id };
  };

  const concurrent = await Promise.all(
    Array.from({ length: 8 }, () =>
      runDurableIntakeSubmission(store, token, payload, execute, { waitMs: 1000, pollMs: 10 }),
    ),
  );
  assert.equal(sideEffectCount, 1, "the reservation owner alone runs the submission callback");
  assert.ok(concurrent.every((outcome) => outcome.decision === "replay"));
  const first = concurrent[0];
  assert.equal(first?.decision, "replay");
  if (first?.decision === "replay") assert.deepEqual(first.response.body, body);

  const retryAfterLostResponse = await runDurableIntakeSubmission(store, token, payload, execute);
  assert.equal(retryAfterLostResponse.decision, "replay");
  if (retryAfterLostResponse.decision === "replay" && first?.decision === "replay") {
    assert.deepEqual(retryAfterLostResponse.response, first.response);
  }

  const conflict = await runDurableIntakeSubmission(store, token, { ...payload, country: "France" }, execute);
  assert.equal(conflict.decision, "conflict");
  const recoveredAfterConflict = await runDurableIntakeSubmission(store, token, payload, execute);
  assert.deepEqual(recoveredAfterConflict, first);
  assert.equal(sideEffectCount, 1);
});

test("changed-payload response preserves the original browser submission cookie", () => {
  const route = readFileSync("app/api/intake/route.ts", "utf8");
  const conflict = route.split('if (decision.decision === "conflict")')[1]?.split('if (decision.decision === "expired")')[0];
  assert.ok(conflict?.includes("INTAKE_IDEMPOTENCY_CONFLICT"));
  assert.ok(conflict.includes("retryable: false"));
  assert.doesNotMatch(conflict, /submissionCookie|cookies\.set/);
});

test("public review Matter and receipt share a transaction and survive a lost response", async () => {
  const db = await fixture();
  try {
    await db.exec(`
      create table public.deals (
        id uuid default gen_random_uuid(), deal_id text unique, access_token text,
        client_name text, client_type text, company_name text, email text, phone text,
        document_type text, use_case text, destination_country text, origin_state text,
        apostille_required boolean, execution_truth jsonb, customer_execution_preference text,
        docs_count int, urgency text, mobile boolean, miles numeric, signers int,
        witnesses int, witness_type text, after_hours boolean, translation boolean,
        multi_country boolean, payment_status text, payment_confirmed boolean,
        amount_paid numeric, currency text, status text, deal_status text,
        conversion_score numeric, priority_tier text, notes text, internal_notes text,
        professional_profile_id uuid, referral_source_type text, referral_source_id text,
        referral_reference text
      );
    `);
    await db.exec(readFileSync("supabase/migrations/20261127225503_persist_review_intake_receipt.sql", "utf8"));
    const tokenHash = hashIntakeSubmissionToken(token);
    const payloadHash = hashIntakeSubmissionPayload(payload);
    const store = pgStore(db);
    const deal = {
      deal_id: body.deal_id,
      status: "intake_received",
      deal_status: "reviewing",
      payment_status: "unpaid",
      payment_confirmed: false,
      amount_paid: 0,
      currency: "USD",
    };
    const receipt = { success: true, deal_id: body.deal_id, quote_state: "review_required" };
    const persist = () => db.query(
      "select * from public.persist_review_intake_receipt($1, $2, $3::jsonb, $4::jsonb)",
      [tokenHash, payloadHash, JSON.stringify(deal), JSON.stringify(receipt)],
    );

    assert.equal((await store.claim(tokenHash, payloadHash)).decision, "owner");
    await db.exec("set role anon");
    await assert.rejects(persist, /permission denied/);
    await db.exec("reset role");
    await db.exec(`
      alter table public.intake_submission_idempotency
      add constraint test_receipt_failure check (state <> 'completed');
      set role service_role;
    `);
    await assert.rejects(persist, /test_receipt_failure/);
    await db.exec("reset role");
    assert.deepEqual((await db.query("select deal_id from public.deals")).rows, []);
    assert.equal((await store.lookup(tokenHash, payloadHash)).decision, "processing");

    await db.exec(`
      alter table public.intake_submission_idempotency drop constraint test_receipt_failure;
      set role service_role;
    `);
    await persist();
    await assert.rejects(persist, /INTAKE_IDEMPOTENCY_RESERVATION_NOT_ACTIVE/);
    assert.deepEqual(await store.lookup(tokenHash, payloadHash), {
      decision: "replay",
      response: { status: 200, body: receipt, dealId: body.deal_id },
    });
    await db.exec("reset role");
    assert.deepEqual((await db.query("select deal_id from public.deals")).rows, [{ deal_id: body.deal_id }]);
  } finally {
    await db.close();
  }
});
