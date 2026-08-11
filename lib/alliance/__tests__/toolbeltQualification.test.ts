import assert from "node:assert/strict";
import test from "node:test";
import { evaluateToolbeltQualification } from "../toolbeltQualification";
import { evaluateAllianceDispatchEligibility } from "../dispatchEngine";

const completeTool = (name: string, required = false) => ({
  toolName: name,
  required,
  signupStatus: "complete" as const,
});

test("80%+ completion, required tools complete, compliance ready and SAFE becomes routing-eligible", () => {
  const result = evaluateToolbeltQualification({
    complianceReady: true,
    accountState: "SAFE",
    tools: [
      completeTool("BlueNotary", true),
      completeTool("Wise Business", true),
      completeTool("Adobe Acrobat", true),
      completeTool("Supabase", true),
      completeTool("Twilio", true),
      completeTool("Google Workspace"),
      completeTool("Canva Pro"),
      completeTool("Calendly"),
      { toolName: "Zapier/Make", required: false, signupStatus: "not_started" },
      completeTool("Milano Command Center", true),
    ],
  });

  assert.equal(result.completionPercent, 90);
  assert.equal(result.requiredToolsComplete, true);
  assert.equal(result.eligibleForDeals, true);
  assert.equal(result.stackLevel, "Qualified");
});

test("completion below 80 blocks routing", () => {
  const result = evaluateToolbeltQualification({
    complianceReady: true,
    tools: [
      completeTool("BlueNotary", true),
      completeTool("Wise Business", true),
      { toolName: "Adobe Acrobat", required: true, signupStatus: "not_started" },
      { toolName: "Supabase", required: true, signupStatus: "not_started" },
    ],
  });

  assert.equal(result.eligibleForDeals, false);
  assert.ok(result.blockers.some((blocker) => blocker.includes("below 80%")));
});

test("non-SAFE compliance account states block routing even with complete toolbelt", () => {
  const result = evaluateToolbeltQualification({
    complianceReady: true,
    accountState: "COOL_DOWN",
    tools: [completeTool("BlueNotary", true)],
  });

  assert.equal(result.eligibleForDeals, false);
  assert.ok(result.blockers.some((blocker) => blocker.includes("COOL_DOWN")));
});

test("dispatch eligibility composes Tool Belt with capability, availability, and jurisdiction", () => {
  const result = evaluateAllianceDispatchEligibility({
    toolbelt: {
      complianceReady: true,
      accountState: "SAFE",
      tools: [completeTool("BlueNotary", true), completeTool("Wise", true)],
    },
    capabilityMatch: true,
    availabilityConfirmed: false,
    jurisdictionMatch: true,
  });

  assert.equal(result.eligibleForRoutingConsideration, false);
  assert.ok(result.blockers.includes("Partner availability is not confirmed."));
});
