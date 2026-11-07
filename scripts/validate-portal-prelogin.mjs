// Guard the private portal entry and preserve the authenticated portal routes.
// /secure-portal resolves into /portal, whose session and role gates own access.

import { readFileSync, existsSync } from "fs";

const errors = [];

const PAGE = "app/secure-portal/page.tsx";
if (!existsSync(PAGE)) {
  errors.push(`${PAGE} does not exist (private portal entry missing)`);
}
const src = existsSync(PAGE) ? readFileSync(PAGE, "utf8") : "";

// The secure entry must resolve into the real access-controlled portal.
// Marketing previews and fabricated operational states do not belong here.
if (!/redirect\(["']\/portal["']\)/.test(src)) errors.push("Secure entry must redirect to the canonical /portal");
if (!/robots:\s*\{\s*index:\s*false/.test(src)) errors.push("Secure entry must be noindex");
for (const phrase of ["Live Matter shell preview", "MS-2026-08-###", "50% deposit verified", "scheduling gate satisfied", "const PANELS", "EXECUTION_RAIL"]) {
  if (src.includes(phrase)) errors.push(`Secure entry renders a forbidden sample operational state: ${phrase}`);
}

// The authenticated portal tree must remain intact (do not remove protected routes).
const PROTECTED_ROUTES = [
  "app/portal/page.tsx",
  "app/portal/[token]/page.tsx",
  "app/portal/tracking/page.tsx",
  "app/portal/invoice/page.tsx",
  "app/portal/documents/page.tsx",
  "app/portal/layout.tsx",
];
for (const r of PROTECTED_ROUTES) {
  if (!existsSync(r)) errors.push(`authenticated portal route removed (do not touch): ${r}`);
}

// Auth protection on the portal layout must still redirect unauthenticated users.
const layout = existsSync("app/portal/layout.tsx") ? readFileSync("app/portal/layout.tsx", "utf8") : "";
if (!/redirect\(["'`]\/login/.test(layout)) {
  errors.push("app/portal/layout.tsx no longer redirects unauthenticated visitors to /login (auth weakened)");
}

if (errors.length) {
  console.error("validate:portal-prelogin FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} portal-prelogin error(s)`);
}
console.log(
  "validate:portal-prelogin passed (/secure-portal redirects to protected /portal; no sample operational states; authenticated portal and auth gate intact)",
);
