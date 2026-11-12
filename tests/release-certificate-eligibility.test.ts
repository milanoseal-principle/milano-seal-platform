import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { releaseCertificateEligibility } from "@/lib/release/certificateEligibility";

// Regression (Codex P1 on #488): once the release_certificates insert was repaired, an operator
// could issue a *valid* certificate for an unpaid, unreleased Matter. Certificates may only attest
// verified settlement plus the canonical DOC_RELEASE_CONFIRMED custody event.

type Row = Record<string, unknown>;
function stub(tables: Record<string, Row[]>): SupabaseClient {
  const query = (table: string) => {
    const filters: [string, unknown][] = [];
    let desc: string | null = null;
    const api = {
      select: () => api,
      eq: (k: string, v: unknown) => (filters.push([k, v]), api),
      order: (k: string) => ((desc = k), api),
      limit: () => api,
      maybeSingle: async () => {
        let rows = (tables[table] ?? []).filter((r) => filters.every(([k, v]) => r[k] === v));
        if (desc) rows = [...rows].sort((a, b) => String(b[desc!]).localeCompare(String(a[desc!])));
        return { data: rows[0] ?? null, error: null };
      },
    };
    return api;
  };
  return { from: query } as unknown as SupabaseClient;
}
const M = "00000000-0000-4000-8000-000000000001";
const settled = { id: M, payment_confirmed: true, payment_settlement_status: "cleared" };

test("missing Matter is 404", async () => {
  assert.deepEqual(await releaseCertificateEligibility(stub({ deals: [] }), M), { ok: false, status: 404, error: "Matter not found", gate: "MATTER_NOT_FOUND" });
});

test("unpaid or unsettled Matter cannot be certified", async () => {
  for (const deal of [{ id: M, payment_confirmed: false, payment_settlement_status: null }, { id: M, payment_confirmed: true, payment_settlement_status: "pending" }]) {
    const r = await releaseCertificateEligibility(stub({ deals: [deal], custody_ledger: [{ deal_id: M, event: "DOC_RELEASE_CONFIRMED", created_at: "2026-11-01T00:00:00Z" }] }), M);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.gate, "VERIFIED_SETTLEMENT_REQUIRED");
  }
});

test("settled Matter without the canonical release cannot be certified", async () => {
  const r = await releaseCertificateEligibility(stub({ deals: [settled], custody_ledger: [{ deal_id: M, event: "DOC_DELIVERED", created_at: "2026-11-01T00:00:00Z" }] }), M);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.gate, "CANONICAL_RELEASE_REQUIRED");
});

test("settled and released Matter is eligible with the recorded release time", async () => {
  const r = await releaseCertificateEligibility(stub({ deals: [settled], custody_ledger: [
    { deal_id: M, event: "DOC_RELEASE_CONFIRMED", created_at: "2026-11-01T00:00:00Z" },
    { deal_id: M, event: "DOC_RELEASE_CONFIRMED", created_at: "2026-11-02T00:00:00Z" },
  ] }), M);
  assert.deepEqual(r, { ok: true, releasedAt: "2026-11-02T00:00:00Z" });
});

test("both certificate routes run the gate before writing", () => {
  for (const [file, write] of [["app/api/dashboard/release-certificates/route.ts", '.from("release_certificates")\n    .insert('], ["app/api/dashboard/certificates/generate/route.ts", '.from("verification_records")']] as const) {
    const source = fs.readFileSync(file, "utf8");
    const gate = source.indexOf("await releaseCertificateEligibility(");
    assert.ok(gate > 0, `${file} gates on eligibility`);
    assert.ok(gate < source.indexOf(write), `${file}: gate precedes ${write}`);
    assert.doesNotMatch(source, /matter_status|payment_status === "paid"/, `${file} uses canonical truth only`);
  }
  assert.match(fs.readFileSync("app/api/dashboard/release-certificates/route.ts", "utf8"), /release_date: eligibility\.releasedAt/);
});
