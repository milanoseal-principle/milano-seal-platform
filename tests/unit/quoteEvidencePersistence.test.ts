import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "app/api/deals/[id]/quote/route.ts"),
  "utf8",
);

test("review-required quote commits fail when pricing evidence cannot persist", () => {
  assert.match(source, /reviewEvidenceError/);
  assert.match(source, /if \(reviewEvidenceError\) throw reviewEvidenceError/);
});

test("approved quote commits fail when pricing evidence cannot persist", () => {
  assert.match(source, /quoteEvidenceError/);
  assert.match(source, /if \(quoteEvidenceError\) throw quoteEvidenceError/);
});
