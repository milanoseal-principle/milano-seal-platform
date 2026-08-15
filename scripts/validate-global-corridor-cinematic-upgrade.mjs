#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const errors = [];
const passes = [];

function check(condition, pass, fail) {
  if (condition) passes.push(pass);
  else errors.push(fail);
}

const paths = {
  country: "components/seo/CountryAuthorityPage.tsx",
  corridor: "components/map/SeoCorridorMapPreview.tsx",
  globe: "components/globe/GlobalRouteGlobe.tsx",
  mini: "components/home/MiniAtlasPreview.tsx",
  routeData: "src/features/corridors/globalRouteData.ts",
};

for (const path of Object.values(paths)) {
  check(existsSync(path), `${path} exists`, `${path} is missing`);
}

const source = Object.fromEntries(
  Object.entries(paths).map(([key, path]) => [
    key,
    existsSync(path) ? readFileSync(path, "utf8") : "",
  ]),
);

check(
  /GlobalRouteGlobe/.test(source.country) && /SeoCorridorMapPreview/.test(source.country),
  "country authority page retains both intelligence surfaces",
  "country authority page must retain Authority Coverage and Corridor Preview",
);
check(
  /lg:grid-cols-\[minmax\(0,0\.88fr\)_minmax\(0,1\.12fr\)\]/.test(source.country),
  "country page uses intentional 44/56 intelligence composition",
  "country page must use the responsive 44/56 authority/corridor composition",
);
check(
  /GLOBAL_ROUTE_DATA/.test(source.corridor) && /getGlobalRoute/.test(source.corridor),
  "corridor preview uses canonical route data",
  "corridor preview must use canonical GLOBAL_ROUTE_DATA/getGlobalRoute",
);
check(
  /getCountryBySlug/.test(source.routeData) && /verificationRequired/.test(source.routeData),
  "public corridor data defers to canonical compliance truth",
  "global route data must defer to getCountryBySlug and preserve verification-required state",
);
check(
  /getGlobalRoute/.test(source.mini) && /routeRecord/.test(source.mini),
  "Mini Atlas uses canonical route status instead of stale destination flags",
  "Mini Atlas must bind selected-country visual status to canonical global route data",
);
check(
  /selectedSlug/.test(source.globe) && /GLOBAL_ROUTE_DATA/.test(source.globe),
  "authority coverage supports selected country context",
  "authority coverage must support selectedSlug with canonical route data",
);
check(
  /Route verification required/.test(source.globe) && /route\.verificationRequired/.test(source.corridor),
  "verification-required corridors render a distinct safe state",
  "verification-required corridors must not be mislabeled as automatically Hague or consular",
);
check(
  /useReducedMotion/.test(source.corridor) && /useReducedMotion/.test(source.globe) && /useReducedMotion/.test(source.mini),
  "reduced-motion behavior is implemented across upgraded motion surfaces",
  "all upgraded motion surfaces must honor reduced motion",
);
check(
  /Execution Corridor/.test(source.mini) && !/Live Corridor/.test(source.mini),
  "Mini Atlas uses non-telemetry Execution Corridor labeling",
  "Mini Atlas must use Execution Corridor instead of ambiguous Live Corridor",
);
check(
  /\/map\?country=/.test(source.mini),
  "Mini Atlas deep-links to Atlas with country context",
  "Mini Atlas must deep-link to /map?country=<slug>",
);
check(
  /min-h-\[270px\]/.test(source.corridor) && /sm:min-h-\[320px\]/.test(source.corridor),
  "corridor visual remains useful at mobile and desktop sizes",
  "corridor preview must preserve useful minimum visual height",
);
check(
  /min-h-\[320px\]/.test(source.globe),
  "authority coverage remains readable on responsive layouts",
  "authority coverage must preserve a readable responsive visual field",
);

const combined = Object.values(source).join("\n");
check(
  !/@react-three|three\.js|from ["']three["']|MapContainer/.test(combined),
  "no WebGL/Three/full-map dependency introduced",
  "cinematic upgrade must remain lightweight SVG/CSS",
);
check(
  !/The Milano Seal(?:™)?\s+(?:is|operates as)\s+(?:a\s+)?(?:law\s+)?firm/i.test(combined),
  "no prohibited Milano Seal self-branding as a firm",
  "The Milano Seal must not describe itself as a firm or law firm",
);
check(
  !/users online|live matters|route volume|government feed|approval feed/i.test(combined),
  "no fabricated telemetry copy introduced",
  "fabricated live telemetry language is prohibited",
);

console.log("\nGlobal Corridor Cinematic Upgrade validation\n");
for (const line of passes) console.log(`  ${GREEN}✓${RESET} ${line}`);
for (const line of errors) console.log(`  ${RED}✗${RESET} ${line}`);

if (errors.length) {
  console.log(`\n${RED}${errors.length} check(s) failed${RESET}\n`);
  process.exit(1);
}

console.log(`\n${GREEN}All ${passes.length} checks passed${RESET}\n`);
