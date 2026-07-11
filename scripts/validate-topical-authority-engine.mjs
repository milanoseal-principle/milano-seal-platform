#!/usr/bin/env node
/**
 * Validator: Topical Authority Engine (pillars, Atlas reuse, no duplicate SEO
 * engines, no fabricated metrics).
 */

import { readFileSync, existsSync } from "node:fs";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";
const errors = [];
const ok = [];
const check = (c, p, f) => (c ? ok.push(p) : errors.push(f));
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

for (const p of [
  "lib/topical-authority/types.ts",
  "lib/topical-authority/topicRegistry.ts",
  "lib/topical-authority/contentRegistry.ts",
  "lib/topical-authority/internalLinkEngine.ts",
  "lib/topical-authority/contentSafety.ts",
  "lib/topical-authority/index.ts",
  "components/dashboard/topical-authority/TopicalAuthorityCommandCenter.tsx",
  "app/dashboard/topical-authority/page.tsx",
  "lib/topical-authority/__tests__/topicalAuthority.test.ts",
]) check(existsSync(p), `present: ${p}`, `MISSING: ${p}`);

// Sixteen pillars.
const reg = read("lib/topical-authority/topicRegistry.ts");
const pillarCount = (reg.match(/id:\s*"pillar-/g) || []).length;
check(pillarCount === 16, "sixteen authority pillars registered", `expected 16 pillars, found ${pillarCount}`);

// Country data reuses Atlas — no duplicate country registry.
const content = read("lib/topical-authority/contentRegistry.ts");
check(/from "@\/data\/destinations"/.test(content) && /canonicalSource: "atlas"/.test(content),
  "country topics derive from Atlas (no duplicate country registry)",
  "country topics must derive from canonical Atlas destinations");

// Do NOT duplicate existing SEO engines (sitemap/robots/schema live elsewhere).
check(!existsSync("lib/topical-authority/sitemap.ts") && !existsSync("lib/topical-authority/schema.ts") && !existsSync("lib/topical-authority/metadataBuilder.ts"),
  "no duplicate sitemap/schema/metadata engine created",
  "must reuse existing sitemap/schema/metadata, not duplicate");
check(existsSync("app/sitemap.ts") && existsSync("app/robots.ts") && existsSync("lib/seo/schema.ts"),
  "existing sitemap/robots/schema utilities preserved for reuse",
  "existing SEO utilities must remain");

// Internal-link / orphan engine present.
const link = read("lib/topical-authority/internalLinkEngine.ts");
check(/detectOrphans/.test(link) && /everyTopicLinksToIntake/.test(link),
  "internal-link + orphan engine present",
  "internal-link/orphan engine required");

// No fabricated metrics; command center shows honest states.
const cc = read("components/dashboard/topical-authority/TopicalAuthorityCommandCenter.tsx");
check(/No Search Console integration connected/.test(cc) && !/impressions:\s*\d|traffic:\s*\d|backlinks:\s*\d/.test(cc),
  "dashboard shows no fabricated rankings/traffic/backlinks",
  "dashboard must not fabricate SEO metrics");
const safety = read("lib/topical-authority/contentSafety.ts");
check(/isFabricatedMetric/.test(safety) && /CONTENT_BANNED_CLAIMS/.test(safety),
  "content safety guards fabricated metrics + banned claims",
  "content safety guards required");

// Dashboard/portal stay noindex (dashboard page).
const dash = read("app/dashboard/topical-authority/page.tsx");
check(/index:\s*false/.test(dash), "topical authority dashboard is noindex", "dashboard must be noindex");

// No protected-system imports.
const lib = [
  "lib/topical-authority/types.ts","lib/topical-authority/topicRegistry.ts",
  "lib/topical-authority/contentRegistry.ts","lib/topical-authority/internalLinkEngine.ts",
  "lib/topical-authority/contentSafety.ts",
].map(read).join("\n");
check(!/from\s+["'][^"']*(stripe|shippo|bluenotary|wise-|supabase)/i.test(lib) && !/service_role/.test(lib),
  "no protected-system imports",
  "must not import protected systems");

// ── Programmatic indexation gate (extends the engine; prevents thin pages) ──
const qual = read("lib/topical-authority/programmatic/pageQualityScore.ts");
const elig = read("lib/topical-authority/programmatic/pageEligibility.ts");
check(qual !== "" && elig !== "",
  "programmatic page-quality + indexation gate present",
  "programmatic indexation gate required");
check(/thin content/.test(qual) && /no verified authority source/.test(qual) && /duplicate primary intent/.test(qual),
  "quality gate blocks thin / unsourced / duplicate-intent pages",
  "quality gate must block thin/unsourced/duplicate pages");
check(/approved_indexable/.test(elig) && /inSitemap/.test(elig) && /operatorApproved/.test(elig),
  "only approved-indexable, operator-approved pages enter the sitemap",
  "indexation must gate sitemap on approval");
check(/containsBannedContentClaim/.test(qual),
  "quality gate reuses existing content-safety guard (no duplicate)",
  "quality gate must reuse existing content safety");

try { JSON.parse(readFileSync("package.json", "utf8")); ok.push("package.json valid"); }
catch { errors.push("package.json invalid JSON"); }

console.log("\nTopical Authority Engine validation\n");
for (const l of ok) console.log(`  ${GREEN}✓${RESET} ${l}`);
for (const l of errors) console.log(`  ${RED}✗${RESET} ${l}`);
if (errors.length) { console.log(`\n${RED}${errors.length} failed${RESET}\n`); process.exit(1); }
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
