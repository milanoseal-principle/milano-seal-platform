import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allExecutiveAnswers,
  answerIndustryRevenue,
  answerVerticalExpansion,
  answerMatterControl,
} from "@/lib/commercial-intelligence/executiveEngine";

test("all six executive questions are answered", () => {
  const ans = allExecutiveAnswers();
  assert.equal(ans.length, 6);
  const ids = ans.map((a) => a.questionId);
  for (const q of ["matter_control", "recurring_volume", "referral_networks", "inactive_relationships", "industry_revenue", "vertical_expansion"]) {
    assert.ok(ids.includes(q), `missing ${q}`);
  }
});

test("no verified revenue => industry revenue is insufficient evidence, never fabricated", () => {
  const a = answerIndustryRevenue();
  assert.equal(a.answerStatus, "insufficient_evidence");
  assert.equal(a.verifiedMetrics.verifiedRevenue, 0);
  assert.ok(a.missingEvidence.length > 0);
});

test("matter control requires organization-linked paid matters (none yet)", () => {
  const a = answerMatterControl();
  assert.equal(a.answerStatus, "insufficient_evidence");
  assert.equal(a.verifiedMetrics.verifiedPaidMatters, 0);
});

test("vertical expansion is planning-only from real targets, not labelled as revenue", () => {
  const a = answerVerticalExpansion();
  assert.equal(a.answerStatus, "planning_only");
  assert.equal(a.verifiedMetrics.verifiedRevenueByVertical, 0);
  // Planning metrics carry the real target counts; summary must not claim revenue.
  assert.ok(!/verified revenue/i.test(a.answerSummary) || /no verified revenue/i.test(a.answerSummary));
  assert.ok(a.topEntities.length > 0); // real targets exist (batch 1)
});

test("every answer carries confidence + a next action", () => {
  for (const a of allExecutiveAnswers()) {
    assert.ok(a.confidence.length > 0);
    assert.ok(a.nextAction.length > 0);
  }
});
