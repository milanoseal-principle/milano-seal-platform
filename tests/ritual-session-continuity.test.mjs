import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const operator = await readFile("components/dashboard/entry-ritual.tsx", "utf8");
const portal = await readFile("components/portal/portal-entry-ritual.tsx", "utf8");
const lock = await readFile("components/ritual/RitualEntryLock.tsx", "utf8");

test("operator ritual is session-bound and does not replay across dashboard navigation", () => {
  assert.match(operator, /sessionKey="ms-operator-entry"/);
});

test("portal ritual is session-bound independently from operator workspace", () => {
  assert.match(portal, /sessionKey="ms-portal-entry"/);
  assert.doesNotMatch(portal, /ms-operator-entry/);
});

test("ritual persistence remains presentation-only session storage", () => {
  assert.match(lock, /sessionStorage\.getItem\(sessionKey\)/);
  assert.match(lock, /sessionStorage\.setItem\(sessionKey,\s*"1"\)/);
  assert.doesNotMatch(lock, /localStorage/);
});
