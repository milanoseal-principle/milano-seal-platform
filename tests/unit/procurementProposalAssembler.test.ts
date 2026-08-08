import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assembleProposalOutline,
  PROPOSAL_SECTION_REGISTRY,
} from "@/lib/procurement/proposals/proposalSectionRegistry";

test("proposal assembler uses canonical registry sections in order", () => {
  const outline = assembleProposalOutline(["executive_summary", "pricing_narrative", "references"]);
  assert.deepEqual(outline.map((s) => s.key), ["executive_summary", "pricing_narrative", "references"]);
  for (const s of outline) {
    assert.ok(PROPOSAL_SECTION_REGISTRY.some((r) => r.key === s.key));
  }
});

test("agency-specific sections are flagged per-opportunity", () => {
  const [rate] = assembleProposalOutline(["rate_sheet"]);
  assert.equal(rate.agencySpecific, true);
  const [workflow] = assembleProposalOutline(["operational_workflow"]);
  assert.equal(workflow.agencySpecific, false);
  assert.ok(workflow.reusableBody);
});
