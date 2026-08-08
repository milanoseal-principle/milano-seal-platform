import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { quickTagParse } from "../quickTags";

const WIZARD = readFileSync("components/intake/intake-wizard.tsx", "utf8");

// P0.1 — foreign destination must NOT auto-force apostille in the submit payload.
test("submit payload does not fabricate apostille from a foreign destination", () => {
  // The old fabrication OR-ed destination_country !== "United States". It must be gone.
  assert.ok(
    !/apostille:\s*\n?\s*data\.apostille_required\s*\|\|/.test(WIZARD),
    "apostille must not be OR'd with a foreign-destination check",
  );
  assert.ok(/apostille: data\.apostille_required,/.test(WIZARD), "apostille = explicit intent only");
});

// P0.2 — AI analysis must not overwrite an explicit client apostille/translation choice.
test("handleAnalysisReady respects explicit client choice (precedence)", () => {
  assert.ok(/apostilleChoice === ""\)\s*merged\.apostille_required/.test(WIZARD));
  assert.ok(/translationChoice === ""\)\s*merged\.translation_needed/.test(WIZARD));
});

// quickTags is now the single interpretation truth (no leftover regex override).
test("quickTags has no duplicate RON override block", () => {
  const src = readFileSync("lib/intake/quickTags.ts", "utf8");
  assert.ok(!/RON_HINTS/.test(src), "leftover RON_HINTS regex block removed");
  assert.ok(!/NOTAR_NEGATED_BEFORE/.test(src), "leftover #159 negation block removed");
  // exactly one assignment to ronReviewRequired
  assert.equal((src.match(/out\.ronReviewRequired\s*=/g) || []).length, 1);
});

// Regression: the reported phrase still resolves correctly through the engine.
test("no-notarization phrase resolves apostille=true, RON=false", () => {
  const out = quickTagParse("2 apostille Colombia no notarization needed");
  assert.equal(out.apostilleRequired, true);
  assert.equal(out.ronReviewRequired, false);
});
