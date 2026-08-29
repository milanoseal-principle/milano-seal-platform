import test from "node:test"; import assert from "node:assert/strict"; import { SEO_EVIDENCE } from "@/lib/seo/evidence/registry"; import { requiresReview } from "@/lib/seo/evidence/freshness";
test("evidence is fresh at its governed verification date", () => { for (const record of SEO_EVIDENCE) assert.equal(requiresReview(record, new Date("2026-08-29")), false); });
