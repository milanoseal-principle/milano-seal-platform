import { existsSync, readFileSync } from "node:fs";

const required = [
  "components/NavigationLoader.tsx",
  "components/motion/CinematicPageShell.tsx",
  "components/animations/StatusTransitionPill.tsx",
  "components/portal/MatterJourneyCard.tsx",
  "components/portal/CustodyTimeline.tsx",
  "components/portal/PortalCourierCustody.tsx",
  "components/payments/SecurePaymentCard.tsx",
  "components/landing/TrustCoreCinematicField.tsx",
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

const portal = readFileSync("app/portal/page.tsx", "utf8");
for (const token of ["MatterJourneyCard", "CustodyTimeline", "PortalCourierCustody", "PortalEntryRitual"]) {
  if (!portal.includes(token)) throw new Error(`Portal visual projection missing: ${token}`);
}

const payment = readFileSync("components/payments/SecurePaymentCard.tsx", "utf8");
for (const token of ["aria-busy", "refresh", "disabled"]) {
  if (!payment.includes(token)) throw new Error(`Payment interaction feedback missing: ${token}`);
}

const trust = readFileSync("components/landing/TrustCoreCinematicField.tsx", "utf8");
for (const token of ["useReducedMotion", "pointer-events-none", "trust-neural-signal", "beamRotation"]) {
  if (!trust.includes(token)) throw new Error(`Trust Core cinematic safeguard missing: ${token}`);
}

const status = readFileSync("components/animations/StatusTransitionPill.tsx", "utf8");
if (!status.includes("milanoTransitions.interaction")) {
  throw new Error("Status transitions must use canonical Milano interaction timing");
}

console.log("Final visual-system hardening validation passed.");
