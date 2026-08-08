import assert from "node:assert/strict";
import test from "node:test";
import { buildDynamicSessionPlaybook } from "../dynamicSessionPlaybook";

test("builds a complete jurat playbook from resolved facts", () => {
  const playbook = buildDynamicSessionPlaybook({
    matterId: "MS-2026-0001",
    matterLabel: "Affidavit of One and the Same Person",
    documentType: "Affidavit of One and the Same Person",
    destinationCountry: "Italy",
    executionMethod: "ron",
    notarialAct: "jurat",
    estimatedSessionMinutes: 15,
    requiredDocuments: ["Government ID", "Final Affidavit"],
    requiredStatements: ["Oath or affirmation"],
    oathState: "required",
    witnessState: "not_required",
    translatorState: "not_required",
    looseCertificateState: "not_required",
    postSessionActions: ["Quality review", "Apostille readiness review"],
  });

  assert.equal(playbook.readyForOperatorUse, true);
  assert.deepEqual(playbook.blockers, []);
  assert.equal(playbook.notarialAct, "jurat");
  assert.equal(playbook.executionMethod, "ron");
  assert.equal(playbook.witnessCount, null);
});

test("unknown execution facts block operator use instead of being fabricated", () => {
  const playbook = buildDynamicSessionPlaybook({
    matterId: "MS-2026-0002",
    matterLabel: "International Affidavit",
    documentType: "International Affidavit",
    executionMethod: "unknown",
    notarialAct: "unknown",
  });

  assert.equal(playbook.readyForOperatorUse, false);
  assert.ok(playbook.blockers.includes("Execution method is not confirmed."));
  assert.ok(playbook.blockers.includes("Notarial act is not confirmed."));
  assert.ok(playbook.blockers.includes("Witness requirement is not confirmed."));
});

test("required witness state requires a witness count", () => {
  const playbook = buildDynamicSessionPlaybook({
    matterId: "MS-2026-0003",
    matterLabel: "Witnessed document",
    documentType: "Power of Attorney",
    executionMethod: "in_person",
    notarialAct: "acknowledgment",
    oathState: "not_required",
    witnessState: "required",
    translatorState: "not_required",
    looseCertificateState: "not_required",
  });

  assert.equal(playbook.readyForOperatorUse, false);
  assert.ok(playbook.blockers.includes("Witness count is required when witnesses are required."));
});

test("jurat requires oath confirmation", () => {
  const playbook = buildDynamicSessionPlaybook({
    matterId: "MS-2026-0004",
    matterLabel: "Affidavit",
    documentType: "Affidavit",
    executionMethod: "ron",
    notarialAct: "jurat",
    witnessState: "not_required",
    translatorState: "not_required",
    looseCertificateState: "not_required",
  });

  assert.equal(playbook.readyForOperatorUse, false);
  assert.ok(playbook.blockers.some((blocker) => blocker.includes("Oath/affirmation")));
});
