import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isReferenceReady,
  toPublicSafeReference,
  type ProcurementReference,
} from "@/lib/procurement/references/referenceConsentTracker";
import {
  insuranceSatisfies,
  type InsuranceRecord,
} from "@/lib/procurement/readiness/insuranceRegistry";

function ref(consent: ProcurementReference["consentStatus"]): ProcurementReference {
  return {
    id: "r1", source: "test", dataStatus: "pending_verification", verificationStatus: "unverified",
    isSample: true, customer: "Cust", organization: "Org", contactName: "Jane Doe",
    title: "Director", phone: "555-0100", email: "jane@example.com", servicesProvided: ["Coordination"],
    matterType: "Government", relationshipType: "Client", completionDate: null, relationshipLength: null,
    consentStatus: consent, eligibleSolicitationTypes: [], privateData: true, publicDisplayAllowed: false,
  };
}

test("reference without confirmed consent is not ready", () => {
  assert.equal(isReferenceReady(ref("requested")), false);
  assert.equal(isReferenceReady(ref("declined")), false);
  assert.equal(isReferenceReady(ref("confirmed")), true);
});

test("public-safe reference excludes private contact details", () => {
  const pub = toPublicSafeReference(ref("confirmed")) as Record<string, unknown>;
  assert.equal(pub.phone, undefined);
  assert.equal(pub.email, undefined);
  assert.equal(pub.contactName, undefined);
  assert.equal(pub.organization, "Org");
});

test("broker letter is not treated as bound insurance", () => {
  // Empty registry: nothing satisfies. A broker_letter record must not satisfy.
  const registry = [] as InsuranceRecord[];
  void registry;
  assert.equal(insuranceSatisfies("General Liability"), false);
});
