import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const code = (path: string) => read(path).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("review events attach to a Matter only through the portal access token", () => {
  const route = code("app/api/reviews/request/route.ts");
  // The token-less matterId lookup let any caller write into any Matter's
  // activity history and interpolated input into a PostgREST .or() filter.
  assert.doesNotMatch(route, /\.or\(/);
  assert.doesNotMatch(route, /\bmatterId\b/);
  assert.match(route, /\.eq\("access_token", token\)/);
  assert.match(route, /deal_id: dealId,/);
});

test("review events are size- and type-bounded before logging", () => {
  const route = read("app/api/reviews/request/route.ts");
  assert.match(route, /const MAX_BODY_BYTES = 8 \* 1024;/);
  assert.match(route, /status: 413/);
  assert.match(route, /feedback: text\(feedback, 2000\)/);
  assert.match(route, /Math\.min\(5, Math\.max\(0, Math\.round\(rating\)\)\)/);
});

test("the portal still attributes review prompts with its token", () => {
  const portal = read("components/portal/portal-client.tsx");
  assert.match(portal, /<SealImpressionReview\s+token=\{token\}/);
});
