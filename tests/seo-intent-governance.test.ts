import test from "node:test"; import assert from "node:assert/strict"; import { SEO_AUTHORITY_NODES } from "@/lib/seo/authority/registry"; import { findIntentCollisions } from "@/lib/seo/intent/cannibalization";
test("governed indexable SEO nodes have unique intent/query pairs", () => assert.deepEqual(findIntentCollisions(SEO_AUTHORITY_NODES), []));
