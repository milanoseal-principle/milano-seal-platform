import { existsSync, readFileSync } from "node:fs";

const infrastructure = [
  "app/layout.tsx",
  "app/loading.tsx",
  "app/error.tsx",
  "app/globals.css",
  "components/motion/CinematicPageShell.tsx",
  "lib/motion/milano-motion.ts",
  "lib/motion/use-milano-reduced-motion.ts",
  "docs/architecture/CINEMATIC_CROSS_PLATFORM_COVERAGE.md",
];
for (const file of infrastructure) {
  if (!existsSync(file)) throw new Error(`Missing route-wide cinematic infrastructure: ${file}`);
}

const representativeRoutes = [
  "app/page.tsx",
  "app/intake/page.tsx",
  "app/map/page.tsx",
  "app/about/page.tsx",
  "app/founder/page.tsx",
  "app/alliance/page.tsx",
  "app/portal/page.tsx",
  "app/portal/tracking/page.tsx",
  "app/portal/invoice/page.tsx",
  "app/dashboard/page.tsx",
  "app/dashboard/intake/page.tsx",
  "app/dashboard/deals/page.tsx",
  "app/dashboard/pipeline/page.tsx",
  "app/dashboard/admin/payments/page.tsx",
  "app/va/page.tsx",
  "app/login/page.tsx",
];
for (const route of representativeRoutes) {
  if (!existsSync(route)) throw new Error(`Missing protected representative route: ${route}`);
}

const layout = readFileSync("app/layout.tsx", "utf8");
if (!layout.includes("<CinematicPageShell>{children}</CinematicPageShell>")) {
  throw new Error("All routes must inherit the canonical cinematic shell");
}
const css = readFileSync("app/globals.css", "utf8");
for (const rule of ["prefers-reduced-motion: reduce", "focus-visible", "min-height: 44px", "env(safe-area-inset-bottom)"]) {
  if (!css.includes(rule)) throw new Error(`Missing global route safety rule: ${rule}`);
}
const dashboardMotion = readFileSync("components/dashboard/system/DashboardMotion.tsx", "utf8");
if (!dashboardMotion.includes("motionTokens") || !dashboardMotion.includes("useMilanoReducedMotion")) {
  throw new Error("Dashboard motion is not connected to canonical infrastructure");
}
const allianceMotion = readFileSync("components/alliance/AllianceMotionHero.tsx", "utf8");
if (!allianceMotion.includes("useMilanoReducedMotion") || !allianceMotion.includes("IntersectionObserver")) {
  throw new Error("Alliance motion lacks reduced-motion or offscreen pausing");
}
const portalStates = readFileSync("components/portal/portal-empty-states.tsx", "utf8");
if (!portalStates.includes("ms-portal-empty-state")) {
  throw new Error("Portal empty states are not connected to canonical surfaces");
}
console.log(`Cinematic route coverage passed for ${representativeRoutes.length} route entry points.`);
