import { existsSync } from "node:fs";

const required = [
  // service-registry
  "lib/service-registry/types.ts",
  "lib/service-registry/milanoServiceRegistry.ts",
  "lib/service-registry/fingerprintingDocumentSupport.ts",
  "lib/service-registry/apostilleAuthenticationSupport.ts",
  "lib/service-registry/translationCoordination.ts",
  "lib/service-registry/mobileFieldNetwork.ts",
  "lib/service-registry/bookingIntakeRegistry.ts",
  "lib/service-registry/serviceSafety.ts",
  // fingerprinting
  "lib/fingerprinting/types.ts",
  "lib/fingerprinting/fingerprintRoutingEngine.ts",
  "lib/fingerprinting/fingerprintUseCaseRegistry.ts",
  "lib/fingerprinting/agencyInstructionPolicy.ts",
  "lib/fingerprinting/oriRoutingRules.ts",
  "lib/fingerprinting/fbiIdentityHistoryRules.ts",
  "lib/fingerprinting/stateLivescanRules.ts",
  "lib/fingerprinting/fingerprintCardRules.ts",
  "lib/fingerprinting/mobileFingerprintPartnerRules.ts",
  "lib/fingerprinting/fingerprintPartnerPolicy.ts",
  "lib/fingerprinting/fingerprintSafety.ts",
  // apostille-rules
  "lib/apostille-rules/types.ts",
  "lib/apostille-rules/hagueNonHagueRouting.ts",
  "lib/apostille-rules/documentAuthorityClassifier.ts",
  "lib/apostille-rules/stateApostilleRules.ts",
  "lib/apostille-rules/federalAuthenticationRules.ts",
  "lib/apostille-rules/apostilleSubmissionChecklist.ts",
  "lib/apostille-rules/multiDocumentBundleRules.ts",
  "lib/apostille-rules/maxDocumentSubmissionRules.ts",
  "lib/apostille-rules/apostilleRulesSafety.ts",
  "lib/apostille-rules/apostilleRoutingEngine.ts",
  // translations
  "lib/translations/types.ts",
  "lib/translations/translationRequirementEngine.ts",
  "lib/translations/translationPartnerPolicy.ts",
  "lib/translations/translationAccuracyAffidavit.ts",
  "lib/translations/translationSafety.ts",
];

let failures = 0;
for (const file of required) {
  if (!existsSync(file)) {
    console.error(`FAIL missing file: ${file}`);
    failures += 1;
  }
}

if (failures) {
  console.error(`FAIL fingerprint-apostille-expansion: ${failures} missing file(s)`);
  process.exit(2);
}
console.log("OK fingerprint-apostille-expansion: all module files present");
