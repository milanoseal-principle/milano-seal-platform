import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootLayout = readFileSync("app/layout.tsx", "utf8");
const routeLayouts = [
  "app/pricing/layout.tsx",
  "app/process/layout.tsx",
  "app/professional/layout.tsx",
  "app/global-document-intelligence/layout.tsx",
] as const;

test("root metadata retains the canonical Milano brand suffix", () => {
  assert.match(rootLayout, /template:\s*"%s \| The Milano Seal™"/);
});

test("new public route families neutralize duplicate title suffixing", () => {
  for (const path of routeLayouts) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /template:\s*"%s"/);
    assert.match(source, /default:\s*"The Milano Seal™"/);
    assert.doesNotMatch(source, /template:\s*"%s \| The Milano Seal™"/);
  }
});
