import { existsSync, readFileSync } from "node:fs";

const required = [
  "app/loading.tsx",
  "app/error.tsx",
  "components/NavigationLoader.tsx",
  "components/motion/CinematicPageShell.tsx",
  "components/portal/MatterJourneyCard.tsx",
  "components/portal/CustodyTimeline.tsx",
  "components/portal/PortalCourierCustody.tsx",
  "components/payments/SecurePaymentCard.tsx",
  "components/landing/TrustCoreCinematicField.tsx",
  "components/portal/portal-empty-states.tsx",
  "lib/motion/milano-motion.ts",
  "lib/motion/use-milano-reduced-motion.ts",
];

for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing final visual-system dependency: ${file}`);
}

const navigation = readFileSync("components/NavigationLoader.tsx", "utf8");
for (const token of ["milano:navigation-intent", "complete={complete}", "8000", "240"]) {
  if (!navigation.includes(token)) throw new Error(`Navigation continuity missing: ${token}`);
}
if (navigation.includes("setTimeout(() => setLoading(false), 900)")) {
  throw new Error("Legacy fixed 900ms route loader must not return");
}

const shell = readFileSync("components/motion/CinematicPageShell.tsx", "utf8");
if (shell.includes("key={pathname}")) {
  throw new Error("Global cinematic shell must not remount the full application on pathname change");
}

const loading = readFileSync("app/loading.tsx", "utf8");
for (const token of ["Preparing the next view", "Preserving your current context", "aria-busy", "The Milano Seal™"]) {
  if (!loading.includes(token)) throw new Error(`Global loading state missing: ${token}`);
}
for (const staleToken of ["Preparing secure workspace", "authoritative matter state"]) {
  if (loading.includes(staleToken)) throw new Error(`Global loading state must remain route-neutral: ${staleToken}`);
}

const recovery = readFileSync("app/error.tsx", "utf8");
for (const token of ["Retry view", "error.digest", "The Milano Seal™ · Recovery"]) {
  if (!recovery.includes(token)) throw new Error(`Global recovery state missing: ${token}`);
}

const portal = readFileSync("app/portal/page.tsx", "utf8");
for (const token of ["MatterJourneyCard", "CustodyTimeline", "PortalCourierCustody", "PortalEntryRitual"]) {
  if (!portal.includes(token)) throw new Error(`Portal visual projection missing: ${token}`);
}

const portalStates = readFileSync("components/portal/portal-empty-states.tsx", "utf8");
for (const token of ["ExpiredPortalToken", "PaymentPending", "ReviewNeeded", "CourierTrackingUnavailable"]) {
  if (!portalStates.includes(token)) throw new Error(`Portal state language missing: ${token}`);
}

const payment = readFileSync("components/payments/SecurePaymentCard.tsx", "utf8");
for (const token of ["aria-busy", "refresh", "disabled"]) {
  if (!payment.includes(token)) throw new Error(`Payment interaction feedback missing: ${token}`);
}

const trust = readFileSync("components/landing/TrustCoreCinematicField.tsx", "utf8");
for (const token of ["useReducedMotion", "pointer-events-none", "trust-neural-signal", "beamRotation"]) {
  if (!trust.includes(token)) throw new Error(`Trust Core cinematic safeguard missing: ${token}`);
}

console.log("Final visual-system hardening validation passed.");
