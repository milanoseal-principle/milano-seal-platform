import { test } from "node:test";
import assert from "node:assert/strict";
import { calculatePrice } from "@/lib/pricing";
import { INTERNAL_PRICING } from "@/lib/command-center/pricingIntelligence";
import {
  DOCUMENT_FEES,
  MATTER_BASES,
  MOBILE_TRAVEL_FEES,
  NOTARY_SIGNER_FEES,
  SPECIAL_HANDLING_FEES,
  TIMING_FEES,
} from "@/lib/pricing/pricingCatalog";
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

test("command-center pricing intelligence derives from the canonical private catalog", () => {
  assert.deepEqual(INTERNAL_PRICING.laneBase, {
    Signature: MATTER_BASES.signature.amount,
    Priority: MATTER_BASES.priority.amount,
    Executive: MATTER_BASES.executive.amount,
  });

  assert.equal(INTERNAL_PRICING.matterBase.Authentication, MATTER_BASES.authentication.amount);
  assert.equal(INTERNAL_PRICING.matterBase.IrishPassportExecution, MATTER_BASES.irish_passport_execution.amount);
  assert.equal(INTERNAL_PRICING.components.additionalDocument, DOCUMENT_FEES.additional_non_apostille_document);
  assert.equal(INTERNAL_PRICING.components.additionalSigner, NOTARY_SIGNER_FEES.additional_signer);
  assert.equal(INTERNAL_PRICING.components.notarizedSignature, NOTARY_SIGNER_FEES.additional_notarized_signature_tracking);
  assert.equal(INTERNAL_PRICING.components.floridaNotarialAct, NOTARY_SIGNER_FEES.florida_notarial_act);
  assert.equal(INTERNAL_PRICING.components.internationalSignerCoordination, NOTARY_SIGNER_FEES.international_signer_coordination);
  assert.equal(INTERNAL_PRICING.components.multiJurisdictionHandling, DOCUMENT_FEES.multi_jurisdiction_handling);
  assert.equal(INTERNAL_PRICING.components.additionalApostille, DOCUMENT_FEES.additional_apostilled_document);
  assert.equal(INTERNAL_PRICING.components.executiveInPersonStateHandling, SPECIAL_HANDLING_FEES.executive_in_person_state_handling);
  assert.equal(INTERNAL_PRICING.components.fbiApostilleCoordination, DOCUMENT_FEES.fbi_federal_apostille_coordination);
  assert.equal(INTERNAL_PRICING.components.expeditedTimelineSurcharge, TIMING_FEES.expedited);
  assert.equal(INTERNAL_PRICING.components.urgentSameDaySurcharge, TIMING_FEES.rush_same_day);
  assert.equal(INTERNAL_PRICING.components.afterHoursEveningPremium, TIMING_FEES.after_hours_evening);
  assert.equal(INTERNAL_PRICING.components.weekendExecutionPremium, TIMING_FEES.weekend);
  assert.equal(INTERNAL_PRICING.components.holidayExecutionPremium, TIMING_FEES.holiday);
  assert.equal(INTERNAL_PRICING.components.mobileTravelLocalRadiusMiles, MOBILE_TRAVEL_FEES.local_radius_miles);
  assert.equal(INTERNAL_PRICING.components.mobileTravel11To25, MOBILE_TRAVEL_FEES.tier_11_25);
  assert.equal(INTERNAL_PRICING.components.mobileTravel26To50, MOBILE_TRAVEL_FEES.tier_26_50);
});
