// validate:portal-prelogin — Phase 1 trust fix guard.
//
// The pre-login portal VALUE page lives at /secure-portal (public), NOT /portal.
// /portal is the authenticated matter tree and stays behind the auth wall
// (proxy.ts + app/portal/layout.tsx redirect unauthenticated visitors to /login),
// so a pre-login value page cannot live there without weakening auth.
//
// This validator asserts the value page exists with the required trust copy and
// CTAs, that it carries no banned phrases, and that the authenticated portal tree
// (/portal, /portal/[token], etc.) and payment/auth/DB files were NOT altered.

import { readFileSync, existsSync } from "fs";

const errors = [];

const PAGE = "app/secure-portal/page.tsx";
if (!existsSync(PAGE)) {
  errors.push(`${PAGE} does not exist (pre-login value page missing)`);
}
const src = existsSync(PAGE) ? readFileSync(PAGE, "utf8") : "";

// Required copy / CTAs.
const REQUIRED = [
  "Secure Matter Portal",
  "Track your matter from intake to international release",
  "Login",
  "Begin Secure Intake",
  "Payment-Gated Execution",
  "Final acceptance remains subject to the receiving authority",
];
for (const phrase of REQUIRED) {
  if (!src.includes(phrase)) errors.push(`${PAGE} is missing required copy: "${phrase}"`);
}
// CTA destinations.
if (!/href="\/intake"/.test(src)) errors.push(`${PAGE} is missing a Begin Secure Intake CTA -> /intake`);
if (!/href="\/login/.test(src)) errors.push(`${PAGE} is missing a Login CTA -> /login`);

// Banned phrases on this public surface.
const BANNED = [
  /\bStripe\b/,
  /AES-?256/i,
  /guaranteed accept/i,
  /government approved/i,
  /legal advice/i,
  /instant approval/i,
  /Notarize From Anywhere/i,
  /Mission Control/i,
  /Sovereign Command/i,
  /Compliance Map/i,
  /Virtual Assistant/i,
  /VA Support Role/i,
  // fake courier ETA / GPS / live-tracking language
  /live tracking map/i,
  /GPS tracking/i,
  /real-?time GPS/i,
];
for (const re of BANNED) {
  if (re.test(src)) errors.push(`${PAGE} contains banned phrase: ${re}`);
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
  "validate:portal-prelogin passed (/secure-portal value page present with required copy + CTAs; authenticated /portal tree and auth gate intact)",
);
