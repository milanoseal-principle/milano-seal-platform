import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("reporting keeps Wise as paid-revenue authority", () => {
  const report = read("app/api/dashboard/discounts/report/route.ts");
  assert.match(report, /Wise reconciliation remains authoritative for paid revenue/);
  assert.match(report, /conversion_rate:\s*null/);
  assert.match(report, /No governed code-impression denominator is stored/);
});

test("Alliance benefit assignment is metadata scoped and read-only", () => {
  const benefitsPage = read("app/alliance/benefits/page.tsx");
  const benefitsCard = read("components/alliance/AllianceBenefitsCard.tsx");
  assert.match(benefitsPage, /alliance_member_id/);
  assert.match(benefitsPage, /\.contains\("metadata"/);
  assert.doesNotMatch(benefitsCard, /method:\s*"POST"/);
  assert.doesNotMatch(benefitsCard, /method:\s*"PATCH"/);
  assert.doesNotMatch(benefitsCard, /method:\s*"DELETE"/);
});
