#!/usr/bin/env node
/**
 * Validator: Mini Atlas + Execution Intelligence flow unification.
 *
 * Enforces the locked homepage layout:
 *   - The top dotted Authority Coverage globe (GlobalRouteGlobe) is removed
 *     from the homepage routing preview (but the component is preserved for
 *     the country pages that still use it).
 *   - The bottom-left slot is a TRUE scaled-down reuse of the canonical Atlas
 *     (MiniAtlasPreview, which embeds GlobalIntelMapInteractive).
 *   - The bottom-right slot keeps the Execution Intelligence card.
 *   - The layout grid is grid-cols-1 lg:grid-cols-2 with the Mini Atlas first
 *     in DOM order (so mobile shows Mini Atlas first, Execution second).
 *   - The Mini Atlas deep-links to the full Atlas carrying the country slug.
 */

import { readFileSync, existsSync } from "node:fs";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

const errors = [];
const ok = [];

function check(cond, pass, fail) {
  if (cond) ok.push(pass);
  else errors.push(fail);
}

const previewPath = "components/landing/homepage-routing-preview.tsx";
const miniPath = "components/home/MiniAtlasPreview.tsx";

check(existsSync(previewPath), `${previewPath} exists`, `${previewPath} missing`);
check(existsSync(miniPath), `${miniPath} exists`, `${miniPath} missing`);

if (existsSync(previewPath)) {
  const preview = readFileSync(previewPath, "utf8");

  check(!/GlobalRouteGlobe/.test(preview),
    "top dotted globe removed from homepage preview",
    "GlobalRouteGlobe still referenced in homepage preview — must be removed");

  check(!/MiniCorridorMapPreview/.test(preview),
    "crude MiniCorridorMapPreview no longer used",
    "MiniCorridorMapPreview still referenced — replace with MiniAtlasPreview");

  check(/MiniAtlasPreview/.test(preview),
    "MiniAtlasPreview embedded in homepage preview",
    "MiniAtlasPreview not embedded in homepage preview");

  check(/DestinationIntelligenceCard/.test(preview),
    "Execution Intelligence card retained",
    "DestinationIntelligenceCard missing — Execution Intelligence must stay");

  check(/grid-cols-1[\s\S]*lg:grid-cols-2/.test(preview),
    "layout is grid-cols-1 lg:grid-cols-2",
    "layout grid must be grid-cols-1 lg:grid-cols-2");

  // Mini Atlas must appear before the Execution Intelligence card in DOM order.
  const miniIdx = preview.indexOf("MiniAtlasPreview selected");
  const cardIdx = preview.indexOf("<DestinationIntelligenceCard");
  check(miniIdx > -1 && cardIdx > -1 && miniIdx < cardIdx,
    "Mini Atlas precedes Execution Intelligence in DOM (mobile order correct)",
    "Mini Atlas must precede Execution Intelligence in DOM for mobile order");
}

if (existsSync(miniPath)) {
  const mini = readFileSync(miniPath, "utf8");

  // The Mini Atlas must NOT embed the heavy full Atlas map — it teases it.
  check(!/GlobalIntelMapInteractive|react-leaflet|MapContainer/.test(mini),
    "Mini Atlas does not embed the full Leaflet Atlas (teases, not clones)",
    "Mini Atlas must not embed the full Leaflet Atlas — keep it a lightweight HUD");

  check(/Global Execution Network/i.test(mini),
    "Mini Atlas is a Global Execution Network command widget",
    "Mini Atlas should present as a Global Execution Network widget");

  check(/animate|animateMotion|animateTransform/.test(mini),
    "Mini Atlas is animated (living corridor)",
    "Mini Atlas must be animated");

  check(/DESTINATIONS/.test(mini),
    "Mini Atlas uses canonical DESTINATIONS data",
    "Mini Atlas must use canonical DESTINATIONS data");

  check(/\/map\?country=/.test(mini),
    "Mini Atlas deep-links to full Atlas with country slug",
    "Mini Atlas must deep-link to /map?country=<slug>");

  check(/setInterval/.test(mini) && /pausedRef/.test(mini),
    "Mini Atlas auto-cycles with pause-on-interaction",
    "Mini Atlas must auto-cycle destinations and pause on interaction");

  check(/Florida origin/i.test(mini),
    "Mini Atlas surfaces Florida execution origin",
    "Mini Atlas must surface the Florida execution origin");
}

console.log("\nMini Atlas Intelligence Flow validation\n");
for (const line of ok) console.log(`  ${GREEN}✓${RESET} ${line}`);
for (const line of errors) console.log(`  ${RED}✗${RESET} ${line}`);

if (errors.length) {
  console.log(`\n${RED}${errors.length} check(s) failed${RESET}\n`);
  process.exit(1);
}
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
