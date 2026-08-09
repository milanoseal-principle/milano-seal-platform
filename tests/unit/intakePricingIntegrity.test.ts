import { test } from "node:test";
import assert from "node:assert/strict";
import { calculatePrice } from "@/lib/pricing";
import { mergeAnalysis, emptyAnalysis } from "@/lib/intake/matterAnalysis";

test("canonical screenshot matter prices 2 docs + 2 apostilles + international courier",()=>{
  const q=calculatePrice({tier:"priority",document_count:2,signer_count:1,notarized_signature_count:0,apostille_count:2,urgency:"standard",shipping:"international"});
  assert.equal(q.total,1600);
  assert.equal(q.breakdown.find(x=>x.key==="additional_documents")?.amount,75);
  assert.equal(q.breakdown.find(x=>x.key==="apostille")?.amount,400);
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
