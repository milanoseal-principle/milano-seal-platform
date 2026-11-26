import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POST } from "@/app/api/deals/[id]/payment/route";

// Owner-authorized retirement (2026-11-26) of the legacy direct payment writers.
// None of them may read or write any data; payment truth comes only from the
// signature-verified Wise reconciliation path.

const code = (path: string) =>
  readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const DATA_ACCESS = [
  /createClient\(/, /createAdminClient/, /supabaseServer/, /getMatterById/, /updateMatter/, /writeEventLedger/,
  /writeMatterAuditEvent/, /logActivity/, /\.from\(/, /\.update\(/, /\.insert\(/, /\.upsert\(/, /\.rpc\(/,
  /req(uest)?\.json\(/, /auth\.getUser/, /fetch\(/,
];

test("legacy POST /api/deals/[id]/payment cannot alter financial truth", async () => {
  const res = await POST();
  assert.equal(res.status, 410);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = await res.json();
  assert.equal(body.code, "USE_GOVERNED_WISE_RECONCILIATION");
  assert.match(body.error, /verified Wise settlement/);
});

for (const path of [
  "app/api/deals/[id]/payment/route.ts",
  "app/api/deals/[id]/payment/manual-confirm/route.ts",
  "app/api/deals/[id]/payment/request-final/route.ts",
]) {
  test(`${path} is retired with 410 and performs no data access`, () => {
    const src = code(path);
    assert.match(src, /status: 410/);
    assert.match(src, /"Cache-Control": "no-store"/);
    for (const forbidden of DATA_ACCESS) assert.doesNotMatch(src, forbidden, `${path}: ${forbidden}`);
  });
}

test("manual-confirm still authenticates and requires founder authority before answering 410", () => {
  const src = code("app/api/deals/[id]/payment/manual-confirm/route.ts");
  const guard = src.indexOf("await requireOperatorApiAccess()");
  const founder = src.indexOf('canPerformAction(access.role, "confirm_payment_manual")');
  const gone = src.indexOf("status: 410");
  assert.ok(guard >= 0 && founder > guard && gone > founder, "guard → founder check → 410");
  assert.match(src, /FOUNDER_ADMIN_REQUIRED/);
  for (const claim of ["MANUAL_PAYMENT_CONFIRMED", "SCHEDULING_UNLOCKED", "RELEASE_UNLOCKED", "ready_for_release", "payment_status"]) {
    assert.ok(!src.includes(claim), `manual-confirm must not emit ${claim}`);
  }
});

test("request-final still authenticates before answering 410", () => {
  const src = code("app/api/deals/[id]/payment/request-final/route.ts");
  const guard = src.indexOf("await requireOperatorApiAccess()");
  assert.ok(guard >= 0 && src.indexOf("status: 410") > guard);
  assert.ok(!src.includes("final_payment_required"));
});

test("confirm-final remains a bare re-export of the retired manual-confirm handler", () => {
  assert.equal(readFileSync("app/api/deals/[id]/payment/confirm-final/route.ts", "utf8").trim(), 'export { POST } from "../manual-confirm/route";');
});
