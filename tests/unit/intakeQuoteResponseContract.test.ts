import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const intakeRoute = readFileSync("app/api/intake/route.ts", "utf8");
const operationsDeskRoute = readFileSync(
  "app/dashboard/operations/page.tsx",
  "utf8",
);

test("intake success response carries canonical discount-boundary totals", () => {
  assert.match(intakeRoute, /eligible_subtotal: eligibleSubtotal/);
  assert.match(intakeRoute, /non_discountable_total: nonDiscountableTotal/);
});

test("Operations Desk route resolves to the implemented integrations workspace", () => {
  assert.match(operationsDeskRoute, /redirect\("\/dashboard\/operations\/integrations"\)/);
});
