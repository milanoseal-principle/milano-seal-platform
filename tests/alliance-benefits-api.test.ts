import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("app/api/alliance/benefits/route.ts", "utf8");

test("Alliance benefits API is authenticated and read-only", () => {
  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /Unauthorized/);
  // Partner identity is the canonical operator account of the verified session user.
  assert.match(source, /resolveAlliancePartner\(user\.id\)/);
  assert.doesNotMatch(source, /from\("alliance_partners"\)/);
  assert.match(source, /alliance_member_id/);
  assert.doesNotMatch(source, /export async function POST/);
  assert.doesNotMatch(source, /export async function PATCH/);
  assert.doesNotMatch(source, /export async function DELETE/);
});
