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

test("root metadata preserves authored page titles without re-appending the brand", () => {
  assert.match(rootLayout, /template:\s*"%s"/);
  assert.doesNotMatch(rootLayout, /template:\s*"%s \| The Milano Seal™"/);
  assert.match(
    rootLayout,
    /default:\s*"The Milano Seal™ \| U\.S\. Document Execution for International Use"/,
  );
});

test("public route title templates remain neutral", () => {
  for (const path of routeLayouts) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /template:\s*"%s"/);
    assert.doesNotMatch(source, /template:\s*"%s \| The Milano Seal™"/);
  }
});
