import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tiers = readFileSync("components/landing/execution-tiers.tsx", "utf8");
const pricing = readFileSync("app/pricing/page.tsx", "utf8");
const shell = readFileSync("components/os/MilanoOSShell.tsx", "utf8");
const shellCss = readFileSync("styles/components/milano-os-shell.css", "utf8");
const routeCopy = readFileSync("lib/i18n/public-route-copy.ts", "utf8");

for (const label of ["Signature","Priority","Executive"]) {
  assert.ok(tiers.includes(`name: "${label}"`), `Execution scope explainer must preserve ${label}`);
}
for (const forbidden of [
  "Select Signature",
  "Select Priority",
  "Select Executive",
  "?tier=",
  "timeline:",
  "$750",
  "$975",
  "$1,850",
  "$1850",
]) {
  assert.ok(!tiers.includes(forbidden), `Public execution scope explainer contains prohibited legacy behavior/copy: ${forbidden}`);
}
assert.ok(tiers.includes("Assigned after review."), "Execution scope explainer must state that scope is assigned after review");
assert.ok(tiers.includes("not self-selected service packages"), "Execution scope explainer must reject self-selection");
assert.ok(tiers.includes('href="/intake?source=pricing&intent=scope-review"'), "Execution scope explainer CTA must route to canonical intake review");
assert.ok(pricing.includes("<ExecutionTiers />"), "Pricing page must mount the governed execution scope explainer");

for (const token of [
  "favoriteHrefs",
  "recentHrefs",
  "toggleFavorite",
  "tms_os_favorites_",
  "tms_os_recent_",
  "Favorites",
  "Recent",
  "All Destinations",
]) {
  assert.ok(shell.includes(token), `Canonical OS shell missing discoverability token: ${token}`);
}
assert.ok(shell.includes("localStorage"), "Favorites/recent must remain device-local UI state and not create a backend data model");
assert.ok(shell.includes("function findActiveNavItem"), "Dashboard discovery must resolve nested destinations through one canonical active-item selector");
assert.ok(shell.includes("b.href.length - a.href.length"), "Nested dashboard discovery must prefer the longest matching destination over its parent route");
assert.ok(shell.includes("item.href === activeItem?.href"), "Sidebar and palette active state must highlight only the canonical longest-match destination");
assert.ok(shell.includes("⌘K") || shell.includes("Command"), "Existing command-palette behavior must remain intact");
assert.ok(shellCss.includes(".ms-os-palette__favorite"), "Command palette favorite control styling is missing");
assert.ok(shellCss.includes(".ms-os-palette__section-label"), "Command palette grouped discovery styling is missing");

for (const copy of [
  "How Milano Scopes Execution",
  "Three execution scopes.",
  "Assigned after review.",
  "Begin Matter Review",
]) {
  assert.ok(routeCopy.includes(copy), `Execution scope explainer missing governed localized route copy: ${copy}`);
}

console.log("PASS execution-scope explainer + canonical dashboard discovery: additive, governed, no pricing/state-machine rebuild");
