import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile("app/api/deals/[id]/route.ts", "utf8");

test("deal API requires an authenticated governed role before admin-client access", () => {
  assert.match(source, /requireDealApiAccess/);
  assert.match(source, /UNAUTHENTICATED/);
  assert.match(source, /FORBIDDEN/);
  assert.match(source, /resolveServerRole/);
});

test("both GET and PATCH invoke the access guard", () => {
  const calls = source.match(/await requireDealApiAccess\(\)/g) ?? [];
  assert.equal(calls.length, 2);
});
