import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateExecutionReadiness,
  canBypassGate,
  EXECUTION_GATE_ORDER,
} from "@/lib/pre-execution/executionGates";
import { requiresOperatorConfirmation } from "@/lib/pre-execution/preExecutionSafety";

test("no gate can be bypassed by any role", () => {
  assert.equal(canBypassGate(), false);
});

test("payment is the first gate and blocks everything downstream", () => {
  assert.equal(EXECUTION_GATE_ORDER[0], "payment");
  const r = evaluateExecutionReadiness({ statuses: {} });
  assert.equal(r.mayProceed, false);
  assert.equal(r.firstBlockingGate, "payment");
});

test("a downstream gate cannot pass while a prior required gate has not passed", () => {
  // Compliance marked passed but payment/identity not passed => compliance blocked.
  const r = evaluateExecutionReadiness({
    statuses: { compliance_decision: "passed" },
  });
  const compliance = r.gates.find((g) => g.gate === "compliance_decision")!;
  assert.equal(compliance.status, "blocked");
  assert.equal(compliance.blockedByPriorGate, true);
  assert.equal(r.firstBlockingGate, "payment");
});

test("mayProceed only when every required gate passes; not_required is skipped", () => {
  const passedAll = EXECUTION_GATE_ORDER.reduce((acc, g) => ({ ...acc, [g]: "passed" as const }), {});
  const r = evaluateExecutionReadiness({ statuses: passedAll });
  assert.equal(r.mayProceed, true);
  assert.equal(r.firstBlockingGate, null);

  const noApostille = evaluateExecutionReadiness({
    statuses: { ...passedAll, apostille_readiness: "not_started" },
    notRequired: ["apostille_readiness"],
  });
  assert.equal(noApostille.mayProceed, true);
});

test("review-dependent AI outputs require operator confirmation", () => {
  assert.equal(requiresOperatorConfirmation("compliance_decision"), true);
  assert.equal(requiresOperatorConfirmation("seal_validation"), true);
  assert.equal(requiresOperatorConfirmation("classify_document_type"), false);
});
