import { test } from "node:test";
import assert from "node:assert/strict";
import {
  APOSTILLE_FEES,
  COMPLEXITY,
  SHIPPING_FEES,
  TIERS,
  URGENCY_FEES,
  calculatePrice,
} from "@/lib/pricing";
import { INTERNAL_BASES } from "@/lib/pricing/pricingDoctrine";
import { INTERNAL_PRICING } from "@/lib/command-center/pricingIntelligence";
import { mergeAnalysis, emptyAnalysis } from "@/lib/intake/matterAnalysis";

test("canonical screenshot matter prices 2 docs + 2 apostilles + international courier",()=>{
  const q=calculatePrice({tier:"priority",document_count:2,signer_count:1,notarized_signature_count:0,apostille_count:2,urgency:"standard",shipping:"international"});
  assert.equal(q.total,1375);
  assert.equal(q.breakdown.some(x=>x.key==="additional_documents"),false);
  assert.equal(q.breakdown.find(x=>x.key==="additional_apostille_documents")?.amount,250);
  assert.equal(q.breakdown.find(x=>x.key==="shipping")?.amount,150);
});

test("explicit zero notarized signatures never fabricates $25",()=>{
  const q=calculatePrice({tier:"priority",notarized_signature_count:0,apostille_count:0});
  assert.equal(q.breakdown.some(x=>x.key==="notarized_signatures"),false);
});

test("timeline preference does not reduce matter-structure confidence",()=>{
  const a=mergeAnalysis(emptyAnalysis(),{country:"Colombia",documentType:"One and the Same Affidavit",documentDescription:"Two affidavits for apostille",signerCount:1,apostilleRequired:true,urgency:"standard"});
  assert.ok(a.confidenceScore >= 99);
  assert.equal(a.missingFields.includes("Preferred execution timeline"),false);
});

test("all secondary pricing intelligence derives from canonical Milano pricing constants", () => {
  assert.equal(INTERNAL_BASES.signature, TIERS.signature.base);
  assert.equal(INTERNAL_BASES.priority, TIERS.priority.base);
  assert.equal(INTERNAL_BASES.executive, TIERS.executive.base);
  assert.equal(INTERNAL_BASES.apostille_first_min, APOSTILLE_FEES.first);
  assert.equal(INTERNAL_BASES.apostille_first_max, APOSTILLE_FEES.first);

  assert.deepEqual(INTERNAL_PRICING.laneBase, {
    Signature: TIERS.signature.base,
    Priority: TIERS.priority.base,
    Executive: TIERS.executive.base,
  });

  assert.equal(INTERNAL_PRICING.components.additionalDocument, COMPLEXITY.additional_document);
  assert.equal(INTERNAL_PRICING.components.additionalSigner, COMPLEXITY.additional_signer);
  assert.equal(INTERNAL_PRICING.components.notarizedSignature, COMPLEXITY.notarized_signature);
  assert.equal(INTERNAL_PRICING.components.internationalSignerCoordination, COMPLEXITY.international_signer);
  assert.equal(INTERNAL_PRICING.components.multiJurisdictionHandling, COMPLEXITY.multi_jurisdiction);
  assert.equal(INTERNAL_PRICING.components.firstApostille, APOSTILLE_FEES.first);
  assert.equal(INTERNAL_PRICING.components.additionalApostille, APOSTILLE_FEES.additional);
  assert.equal(INTERNAL_PRICING.components.executiveInPersonStateHandling, APOSTILLE_FEES.executive_in_person_state_handling);
  assert.equal(INTERNAL_PRICING.components.fbiApostilleCoordination, APOSTILLE_FEES.fbi_apostille);
  assert.equal(INTERNAL_PRICING.components.expeditedTimelineSurcharge, URGENCY_FEES.expedited);
  assert.equal(INTERNAL_PRICING.components.urgentSameDaySurcharge, URGENCY_FEES.same_day);
  assert.equal(INTERNAL_PRICING.components.weekendExecutionPremium, URGENCY_FEES.weekend);
  assert.equal(INTERNAL_PRICING.components.holidayExecutionPremium, URGENCY_FEES.holiday);
  assert.equal(INTERNAL_PRICING.components.standardDomesticShipping, SHIPPING_FEES.standard_domestic);
  assert.equal(INTERNAL_PRICING.components.expeditedDomesticShipping, SHIPPING_FEES.expedited_domestic);
  assert.equal(INTERNAL_PRICING.components.internationalShipping, SHIPPING_FEES.international);
});
