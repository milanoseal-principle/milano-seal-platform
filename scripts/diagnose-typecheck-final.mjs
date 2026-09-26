import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["run", "typecheck", "--", "--pretty", "false"], {
  encoding: "utf8",
  env: { ...process.env, CI: "1" },
  shell: process.platform === "win32",
});
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
if ((result.status ?? 1) === 0) process.exit(0);

const first = output.split(/\r?\n/).find((line) =>
  /\.(?:ts|tsx)\(\d+,\d+\): error TS\d+/.test(line)
) ?? "";

const rootFiles = ["access-intent.ts","activity.ts","aiClassifier.ts","allianceAuth.ts","allianceEligibility.ts","animations.ts","audit.ts","authorityChainCertification.ts","authorityPack.ts","automation.ts","clientProjectionShield.ts","commissionEngine.ts","compliance.ts","complianceValidator.ts","country-jsonld.ts","custodyLedger.ts","dashboard-modules.ts","dashboardAuth.ts","dealBackup.ts","dealId.ts","discountCodes.ts","email.ts","evidencePacket.ts","evidenceStorage.ts","executionReadiness.ts","followupEngine.ts","format.ts","gate.ts","hague-countries.ts","incidentTypes.ts","invoice.ts","jurisdictions.ts","linking.ts","logger.ts","matterCriticality.ts","matterIntelligence.ts","matterRisk.ts","messageEngine.ts","milanoSerialize.ts","ocr.ts","operatorActions.ts","parseIntake.ts","pipelineEngine.ts","portalAuth.ts","portalInvoice.ts","portalProjection.ts","pricing.ts","protectedIdentifier.ts","rbac.ts","resource-guards.ts","scoringEngine.ts","seo-data.ts","seo-document-routing.ts","seo-premium-corridors.ts","seo.ts","shippo.ts","signatureProof.ts","slaEngine.ts","slaMonitor.ts","stateMachine.ts","supabaseClient.ts","supabaseServer.ts","twilio.ts","utils.ts","vaAuth.ts","vaTasks.ts","validation.ts","vault.ts","webhookBus.ts","whatsapp.ts","wise.ts"];
const dirs = ["access","acquisition","ai","alliance","apostille-rules","assistant","atlas","attribution","auth","authorities","autopilot","bluenotary","brand","build","canonical","certification","command-center","commercial-accounts","commercial-intelligence","compliance","config","content","control-plane","conversion","core","corridor","custody","dashboard","deals","delivery","discounts","dispatch","documents","economics","execution-qa","execution","expansion","export","fingerprinting","founder-os","governance","government","high-value-assets","homepage","i18n","intake","integration-command","intelligence-platform","intelligence","internal","international-execution","jurisdictions","maritime","matter-ops","matter","milano-seal","modules","motion","notifications","operations","operator-intelligence","operator-spine","orb","orbit","packaging-delivery","payments","platform","portal2","pre-execution","pricing","procurement","professional","professional360","referrals","relationship-intelligence","release","revenue-stack","revenue","review","reviews","routes","safety","scheduling","schema","security","seo-revenue","seo","service-registry","shippo","supabase","task-orchestration","tasks","testing","tools","topical-authority","translations","trust-chain","trust-network","trust","types","ux","va","vertical-intelligence","website-alignment","wise","workbook"];

if (first.startsWith("lib/pricing/")) {
  const file = first.slice("lib/pricing/".length).split("(")[0];
  const pricingFiles = ["addOnRules.ts","canonicalFacade.ts","canonicalMatterPricing.ts","canonicalPricingGateway.ts","canonicalQuoteOrchestrator.ts","clientPricingProjection.ts","complexityScoring.ts","courtesyEligibility.ts","destinationDocumentQuoteIntelligence.ts","governedQuotePreview.ts","index.ts","laneRecommendation.ts","legacy-client-credit.ts","marketAnchors.ts","matterQuoteSnapshot.ts","milanoPricingTruth.ts","operatorQuoteBuilder.ts","priceCanonicalMatter.ts","pricingAdapters.ts","pricingCatalog.ts","pricingComposer.ts","pricingDoctrine.ts","pricingProjections.ts","pricingSafety.ts","pricingVisibilityPolicy.ts","quoteMutationLock.ts","regulatedPricingRules.ts","smartIntakePricingEngine.ts","types.ts"];
  const idx = pricingFiles.indexOf(file);
  if (idx >= 0) process.exit(40 + idx);
  process.exit(80);
}

if (first.startsWith("lib/")) {
  const rest = first.slice(4);
  if (!rest.includes("/")) {
    const file = rest.split("(")[0];
    const idx = rootFiles.indexOf(file);
    if (idx >= 0) process.exit(40 + idx);
  }
  const dir = rest.split("/")[0];
  const idx = dirs.indexOf(dir);
  if (idx >= 0) process.exit(120 + idx);
  process.exit(230);
}
if (first.startsWith("app/")) process.exit(21);
if (first.startsWith("components/")) process.exit(22);
if (first.startsWith("tests/")) process.exit(23);
if (first.startsWith("scripts/")) process.exit(24);
if (first.startsWith("types/")) process.exit(25);
process.exit(26);
