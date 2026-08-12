import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("app/api/alliance/benefits/route.ts", "utf8");

test("Alliance benefits API is authenticated and read-only", () => {
  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /Unauthorized/);
  assert.match(source, /\.eq\("user_id", user\.id\)/);
  assert.match(source, /alliance_member_id/);
  assert.doesNotMatch(source, /export async function POST/);
  assert.doesNotMatch(source, /export async function PATCH/);
  assert.doesNotMatch(source, /export async function DELETE/);
});
