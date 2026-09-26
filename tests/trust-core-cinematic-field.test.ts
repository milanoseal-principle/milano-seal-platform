import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SOURCE_PATH = "components/landing/TrustCoreCinematicField.tsx";
const source = readFileSync(SOURCE_PATH, "utf8");

test("TrustCoreCinematicField accepts ReactNode children without a single-child guard", () => {
  assert.match(source, /children\s*}:\s*\{\s*children:\s*ReactNode\s*\}/);
  assert.doesNotMatch(source, /(?:React\.)?Children\.only\s*\(/);
  assert.doesNotMatch(source, /\bChildren\s*,/);
  assert.match(source, /\{children\}/);
});

test("TrustCoreCinematicField preserves reduced-motion and interactive field wiring", () => {
  assert.match(source, /useReducedMotion\(\)/);
  assert.match(source, /root\.addEventListener\("pointerover"/);
  assert.match(source, /root\.addEventListener\("pointerout"/);
  assert.match(source, /!reduceMotion\s*&&\s*core/);
});
