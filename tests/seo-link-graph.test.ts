import test from "node:test"; import assert from "node:assert/strict"; import { SEO_AUTHORITY_NODES } from "@/lib/seo/authority/registry"; import { getAuthorityLinks } from "@/lib/seo/authority/links";
test("every indexable node has useful semantic links", () => { for (const node of SEO_AUTHORITY_NODES) assert.ok(getAuthorityLinks(node).length >= 3); });
