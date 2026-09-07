import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyLegacyMatterLoss,
  negativeDomainsRemainDistinct,
  normalizeNegativeEventState,
  type NegativeEvent,
} from "../negative-events";

test("unknown evidence remains UNKNOWN and never becomes REJECTED", () => {
  assert.equal(normalizeNegativeEventState(undefined), "UNKNOWN");
  assert.equal(normalizeNegativeEventState(""), "UNKNOWN");
  assert.equal(normalizeNegativeEventState("not-known"), "UNKNOWN");
  assert.notEqual(normalizeNegativeEventState("not-known"), "REJECTED");
});

test("authority rejection remains distinct from execution failure", () => {
  const authority = classifyLegacyMatterLoss({ matterId: "MS-1", lostStage: "authority_rejected", lossReason: "Receiving authority rejected document" });
  const execution = classifyLegacyMatterLoss({ matterId: "MS-1", lostStage: "execution_failed", lossReason: "RON execution failed" });
  assert.equal(authority.domain, "authority");
  assert.equal(execution.domain, "execution");
  assert.ok(negativeDomainsRemainDistinct(authority, execution));
});

test("professional loss remains distinct from client cancellation", () => {
  const professional = classifyLegacyMatterLoss({ matterId: "MS-2", account: "Studio Rossi", lostStage: "professional_account_lost" });
  const client = classifyLegacyMatterLoss({ matterId: "MS-3", lostStage: "client_cancelled" });
  assert.equal(professional.domain, "professional");
  assert.equal(client.domain, "client");
  assert.ok(negativeDomainsRemainDistinct(professional, client));
});

test("payment block remains distinct from execution failure", () => {
  const payment = classifyLegacyMatterLoss({ matterId: "MS-4", lostStage: "payment_blocked" });
  const execution = classifyLegacyMatterLoss({ matterId: "MS-4", lostStage: "scheduling_failed" });
  assert.equal(payment.domain, "payment");
  assert.equal(execution.domain, "execution");
  assert.ok(negativeDomainsRemainDistinct(payment, execution));
});

test("unrelated explicit negative events do not collapse", () => {
  const a: NegativeEvent = {
    domain: "partner",
    state: "PAUSED",
    matterId: null,
    account: "Partner A",
    actor: null,
    reasonCode: null,
    reason: null,
    source: "test",
    occurredAt: null,
    recoverable: null,
    recoveryOwner: null,
    nextRecoveryAction: null,
    reviewDate: null,
    authority: null,
    confidence: "unknown",
  };
  const b: NegativeEvent = { ...a, domain: "professional", state: "LOST" };
  assert.ok(negativeDomainsRemainDistinct(a, b));
});
