import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasMotionPreference } from "../scripts/lib/reduced-motion-contract.mjs";
const shared = readFileSync("lib/motion/use-milano-reduced-motion.ts", "utf8");
const mini = readFileSync("components/home/MiniAtlasPreview.tsx", "utf8");
test("motion release contract accepts the hydration-safe hook and rejects broken accessibility wiring", () => {
 assert.equal(hasMotionPreference(mini, shared), true);
 assert.equal(hasMotionPreference(mini.replace('useMilanoReducedMotion()', 'false'), shared), false);
 assert.equal(hasMotionPreference(mini.replace('@/lib/motion/use-milano-reduced-motion','untrusted-hook'), shared), false);
 assert.equal(hasMotionPreference(mini, shared.replace('return false;', 'return Math.random() > 0.5;')), false);
 assert.equal(hasMotionPreference(mini, shared.replace('preference.addEventListener("change", onChange);','')), false);
 assert.equal(hasMotionPreference('import { useReducedMotion } from "framer-motion"; const reduce = useReducedMotion();', ''), true);
 assert.equal(hasMotionPreference('/* useReducedMotion */ const reduce = false;', ''), false);
});
