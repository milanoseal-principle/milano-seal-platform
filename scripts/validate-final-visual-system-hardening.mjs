import { existsSync, readFileSync } from "node:fs";

const required = [
  "app/loading.tsx",
  "app/error.tsx",
  "app/global-error.tsx",
  "app/not-found.tsx",
  "components/system/MilanoProductState.tsx",
  "components/NavigationLoader.tsx",
  "components/motion/CinematicPageShell.tsx",
  "components/landing/header.tsx",
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
for (const token of [
  "milano:navigation-intent",
  "MINIMUM_VISIBLE_MS = 700",
  "SETTLE_FADE_MS = 220",
  "SAFETY_RELEASE_MS = 8000",
  "usePublicTranslations",
  "t.loading.title",
  "t.loading.body",
  "z-[9200]",
]) {
  if (!navigation.includes(token)) throw new Error(`Navigation continuity missing: ${token}`);
}
if (navigation.includes("setTimeout(() => setLoading(false), 900)")) {
  throw new Error("Legacy fixed 900ms route loader must not return");
}
if (navigation.includes("<MilanoPageLoader")) {
  throw new Error("Navigation loader must use the full Milano transition surface, not the legacy top rail only");
}
for (const staleSkeleton of ["h-16 rounded-xl", "h-28 rounded-xl"]) {
  if (navigation.includes(staleSkeleton)) throw new Error(`Navigation loader must not restore gray skeleton cards: ${staleSkeleton}`);
}

const shell = readFileSync("components/motion/CinematicPageShell.tsx", "utf8");
for (const token of ["id=\"milano-main\"", "tabIndex={-1}", "useMilanoReducedMotion"]) {
  if (!shell.includes(token)) throw new Error(`Global cinematic shell accessibility missing: ${token}`);
}
if (shell.includes("key={pathname}")) {
  throw new Error("Global cinematic shell must not remount the full application on pathname change");
}

const layout = readFileSync("app/layout.tsx", "utf8");
for (const token of ["Skip to main content", "href=\"#milano-main\"", "viewportFit: \"cover\""]) {
  if (!layout.includes(token)) throw new Error(`Root product shell hardening missing: ${token}`);
}

const loading = readFileSync("app/loading.tsx", "utf8");
if (!loading.includes("MilanoRouteSkeleton")) {
  throw new Error("Global loading state must use the canonical MilanoRouteSkeleton");
}

const states = readFileSync("components/system/MilanoProductState.tsx", "utf8");
const publicDictionary = readFileSync("lib/i18n/public-dictionary.ts", "utf8");
for (const canonicalLoadingCopy of ["Preparing the next view", "Preserving your current context while the destination surface is prepared."]) {
  if (!publicDictionary.includes(canonicalLoadingCopy)) throw new Error(`Canonical English loading copy missing from public dictionary: ${canonicalLoadingCopy}`);
}
for (const token of ["usePublicTranslations", "t.loading.title", "t.loading.body", "aria-busy", "The Milano Seal™", "motion-reduce:animate-none", "min-h-11"]) {
  if (!states.includes(token)) throw new Error(`Canonical Milano product state missing: ${token}`);
}
for (const staleToken of ["Preparing secure workspace", "authoritative matter state"]) {
  if (states.includes(staleToken)) throw new Error(`Global loading state must remain route-neutral: ${staleToken}`);
}

const recovery = readFileSync("app/error.tsx", "utf8");
for (const token of ["Retry view", "error.digest", "The Milano Seal™ · Recovery", "Open secure portal"]) {
  if (!recovery.includes(token)) throw new Error(`Global recovery state missing: ${token}`);
}

const globalRecovery = readFileSync("app/global-error.tsx", "utf8");
for (const token of ["System recovery", "Reload workspace", "<html lang=\"en\">", "error.digest"]) {
  if (!globalRecovery.includes(token)) throw new Error(`Root recovery boundary missing: ${token}`);
}

const notFound = readFileSync("app/not-found.tsx", "utf8");
for (const token of ["Global Intelligence", "Begin secure intake", "MilanoProductState"]) {
  if (!notFound.includes(token)) throw new Error(`Not-found recovery route missing: ${token}`);
}

const header = readFileSync("components/landing/header.tsx", "utf8");
if (header.includes('{ label: "About", href: "/about" }')) {
  throw new Error("Public header must keep About out of primary navigation; Founder/About remain available in the founder trust card.");
}
for (const token of [
  "document.body.style.overflow = \"hidden\"",
  "event.key !== \"Escape\"",
  "aria-current",
  "aria-modal=\"true\"",
  "useMilanoReducedMotion",
  "min-h-12",
  "max-w-[1480px]",
  "min-[1360px]:flex",
]) {
  if (!header.includes(token)) throw new Error(`Header product-quality safeguard missing: ${token}`);
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
