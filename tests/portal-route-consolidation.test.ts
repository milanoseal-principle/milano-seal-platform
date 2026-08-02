import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const trackingNow = readFileSync("app/portal/trackingNow/page.tsx", "utf8");
const v2 = readFileSync("app/portal/v2/page.tsx", "utf8");
const tracking = readFileSync("app/portal/tracking/page.tsx", "utf8");
const portalLayout = readFileSync("app/portal/layout.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");

test("/portal/tracking is the sole canonical tracking implementation", () => {
  // Canonical page does real data work; the compat routes do not.
  assert.ok(/PortalCourierCustody|usePortal|TrackingResponse/.test(tracking));
  assert.ok(tracking.length > 2000, "canonical tracking page should be substantial");
});

test("/portal/trackingNow redirects to /portal/tracking preserving query params", () => {
  assert.ok(/redirect\(`\/portal\/tracking/.test(trackingNow), "must redirect to canonical tracking");
  assert.ok(/searchParams/.test(trackingNow), "must read searchParams");
  assert.ok(/URLSearchParams/.test(trackingNow), "must forward query params");
});

test("/portal/v2 redirects to /portal", () => {
  assert.ok(/redirect\("\/portal"\)/.test(v2), "v2 must redirect to canonical portal");
});

test("legacy routes retain NO data fetching or business logic", () => {
  for (const [name, src] of [["trackingNow", trackingNow], ["v2", v2]] as const) {
    assert.ok(!/fetch\(|createClient|from\("@\/lib\/supabase|usePortal|PortalCourierCustody/.test(src), `${name} must not fetch data`);
    assert.ok(/next\/navigation/.test(src) && /redirect/.test(src), `${name} must be a redirect`);
  }
});

test("canonical app_metadata client auth guard remains enforced on the portal", () => {
  // Portal layout is the single client guard; compat routes live under it.
  assert.ok(/auth\.getUser\(\)/.test(portalLayout));
  assert.ok(!/user_metadata\??\.\s*role/.test(portalLayout), "no user_metadata role authz");
  assert.ok(/app_metadata\?\.role/.test(portalLayout));
});

test("all portal routes stay noindex", () => {
  // Layout-level robots:index:false covers every /portal child, incl. compat routes.
  assert.ok(/robots:\s*\{\s*index:\s*false/.test(portalLayout));
  assert.ok(/robots:\s*\{\s*index:\s*false/.test(v2));
});

test("portal is excluded from the sitemap", () => {
  assert.ok(!/["']\/portal["']/.test(sitemap), "/portal must not appear in sitemap");
  assert.ok(!/portal\//.test(sitemap), "no /portal/* entries in sitemap");
});

test("no redirect loop: compat targets differ from their own paths", () => {
  assert.ok(!/redirect\(`?\/portal\/trackingNow/.test(trackingNow));
  assert.ok(!/redirect\("\/portal\/v2"\)/.test(v2));
});
