// validate:responsive-safety — locks in the OS-wide responsive protections so a
// future edit can't silently reintroduce horizontal scroll or break safe-area
// handling. Complements per-route fixes; this is the regression guard.
//
// Asserts:
//   1. globals.css clamps horizontal overflow on html AND body (no page can push a
//      horizontal scrollbar on any device / zoom level).
//   2. The viewport is configured viewport-fit: cover (notch / Dynamic Island safe
//      areas work).
//   3. No bare `w-screen` (100vw — a classic horizontal-overflow cause) leaks into
//      public client-facing surfaces. `max-w-screen-*` utilities are allowed.

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const errors = [];

// 1. Global overflow clamp.
const css = existsSync("app/globals.css") ? readFileSync("app/globals.css", "utf8") : "";
const htmlClamped = /html[^{}]*\{[^}]*overflow-x:\s*(hidden|clip)/is.test(css);
const bodyClamped = /body[^{}]*\{[^}]*overflow-x:\s*(hidden|clip)/is.test(css);
if (!htmlClamped) errors.push("globals.css: html is missing overflow-x: hidden/clip");
if (!bodyClamped) errors.push("globals.css: body is missing overflow-x: hidden/clip");

// 2. Safe-area viewport.
const layout = existsSync("app/layout.tsx") ? readFileSync("app/layout.tsx", "utf8") : "";
if (!/viewportFit:\s*["']cover["']/.test(layout)) {
  errors.push("app/layout.tsx: viewport is missing viewportFit: 'cover' (safe-area)");
}

// 3. No bare w-screen on public client-facing surfaces.
const SCAN = ["components/landing", "components/portal", "components/payment", "components/conversion"];
const PUBLIC_PAGES = [
  "app/page.tsx", "app/pricing/page.tsx", "app/services/page.tsx", "app/about/page.tsx",
  "app/founder/page.tsx", "app/process/page.tsx",
];
function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(n)) out.push(p);
  }
  return out;
}
const files = [...SCAN.flatMap(walk), ...PUBLIC_PAGES.filter((f) => existsSync(f))];
// Match class token `w-screen` but NOT `max-w-screen-*` / `min-w-screen`.
const bareWScreen = /(?<![-\w])w-screen(?![-\w])/;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  if (bareWScreen.test(src)) errors.push(`bare w-screen (use w-full / max-w-*) in public surface: ${f}`);
}

if (errors.length) {
  console.error("validate:responsive-safety FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} responsive-safety error(s)`);
}
console.log(
  `validate:responsive-safety passed (global overflow clamped on html+body, safe-area viewport, ${files.length} public files clean of bare w-screen)`,
);
