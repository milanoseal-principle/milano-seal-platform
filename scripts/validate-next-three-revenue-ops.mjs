import { GAP_CLOSURE_PROTECTED_CHANGES } from "./governed-production-scope.mjs";
import fs from "node:fs";
import { execSync } from "node:child_process";

const requiredFiles = [
  "lib/conversion/types.ts",
  "lib/conversion/conversionStageRegistry.ts",
  "lib/conversion/followUpScriptRegistry.ts",
  "lib/conversion/paymentRecoveryEngine.ts",
  "lib/conversion/quoteAgingEngine.ts",
  "lib/conversion/highValueFollowUpEngine.ts",
  "lib/conversion/conversionSafety.ts",
  "components/dashboard/conversion/ConversionCommandCenter.tsx",
  "components/dashboard/conversion/ConversionKPIGrid.tsx",
  "components/dashboard/conversion/AbandonedIntakeRecoveryBoard.tsx",
  "components/dashboard/conversion/QuoteFollowUpQueue.tsx",
  "components/dashboard/conversion/UnpaidInvoiceRecoveryBoard.tsx",
  "components/dashboard/conversion/WisePaymentStatusBoard.tsx",
  "components/dashboard/conversion/FounderHighValueFollowUp.tsx",
  "components/dashboard/conversion/PaymentGateEnforcementPanel.tsx",
  "components/dashboard/conversion/FollowUpScriptLibrary.tsx",
  "components/dashboard/conversion/ConversionSafetyPanel.tsx",
  "app/dashboard/conversion/page.tsx",
  "lib/seo-revenue/types.ts",
  "lib/seo-revenue/servicePageRegistry.ts",
  "lib/seo-revenue/countryRevenueMatrix.ts",
  "lib/seo-revenue/ctaMappingEngine.ts",
  "lib/seo-revenue/intakeSourceTracker.ts",
  "lib/seo-revenue/seoOpportunityScoring.ts",
  "lib/seo-revenue/seoRevenueSafety.ts",
  "components/dashboard/seo-revenue/SEORevenueCommandCenter.tsx",
  "components/dashboard/seo-revenue/SEORevenueKPIGrid.tsx",
  "components/dashboard/seo-revenue/ServicePageRevenueBoard.tsx",
  "components/dashboard/seo-revenue/CountryRevenueMatrix.tsx",
  "components/dashboard/seo-revenue/CTAConversionBoard.tsx",
  "components/dashboard/seo-revenue/IntakeSourceAttribution.tsx",
  "components/dashboard/seo-revenue/SEOOpportunityQueue.tsx",
  "components/dashboard/seo-revenue/ContentActionQueue.tsx",
  "components/dashboard/seo-revenue/SEORevenueSafetyPanel.tsx",
  "app/dashboard/seo-revenue/page.tsx",
  "app/services/italy-apostille/page.tsx",
  "app/services/florida-ron-international/page.tsx",
  "app/services/us-documents-abroad/page.tsx",
  "app/services/airport-emergency-document-execution/page.tsx",
  "app/services/education-credential-apostille/page.tsx",
  "app/services/fbi-fingerprinting-document-routing/page.tsx",
  "app/services/attorney-document-execution-referrals/page.tsx",
  "lib/matter-ops/types.ts",
  "lib/matter-ops/matterReadinessEngine.ts",
  "lib/matter-ops/preExecutionQA.ts",
  "lib/matter-ops/identifierVerification.ts",
  "lib/matter-ops/signerWitnessReadiness.ts",
  "lib/matter-ops/apostillePacketReadiness.ts",
  "lib/matter-ops/courierReadiness.ts",
  "lib/matter-ops/releaseGateVisibility.ts",
  "lib/matter-ops/blockerQueueEngine.ts",
  "lib/matter-ops/completedMatterReview.ts",
  "lib/matter-ops/sopUpdateCapture.ts",
  "lib/matter-ops/matterOpsSafety.ts",
  "components/dashboard/matter-ops/MatterOpsCommandCenter.tsx",
  "components/dashboard/matter-ops/MatterReadinessBoard.tsx",
  "components/dashboard/matter-ops/PreExecutionQAChecklist.tsx",
  "components/dashboard/matter-ops/IdentifierVerificationPanel.tsx",
  "components/dashboard/matter-ops/SignerWitnessReadinessPanel.tsx",
  "components/dashboard/matter-ops/ApostillePacketReadinessPanel.tsx",
  "components/dashboard/matter-ops/CourierReadinessPanel.tsx",
  "components/dashboard/matter-ops/ReleaseGateVisibilityPanel.tsx",
  "components/dashboard/matter-ops/IssueBlockerQueue.tsx",
  "components/dashboard/matter-ops/CompletedMatterReviewPanel.tsx",
  "components/dashboard/matter-ops/SOPUpdateCapturePanel.tsx",
  "components/dashboard/matter-ops/MatterOpsSafetyPanel.tsx",
  "app/dashboard/matter-ops/page.tsx",
];

const missing = requiredFiles.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error(`Missing required files:\n${missing.join("\n")}`);
  process.exit(1);
}

const nav = fs.readFileSync("components/dashboard/milano-shell.tsx", "utf8");
for (const route of ["/dashboard/conversion", "/dashboard/seo-revenue", "/dashboard/matter-ops"]) {
  if (!nav.includes(route)) {
    console.error(`Dashboard navigation missing ${route}`);
    process.exit(1);
  }
}

const changed = execSync("git diff --name-only HEAD", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const protectedPatterns = [
  /wise/i,
  /webhook/i,
  /payment.*confirm/i,
  /release.*gate/i,
  /custody/i,
  /supabase.*rls/i,
  /shippo/i,
  /bluenotary/i,
];
const protectedChanges = changed.filter((file) => !GAP_CLOSURE_PROTECTED_CHANGES.includes(file) && protectedPatterns.some((pattern) => pattern.test(file)));
if (protectedChanges.length) {
  console.error(`Protected files changed:\n${protectedChanges.join("\n")}`);
  process.exit(1);
}

const scannedFiles = requiredFiles.concat(["components/dashboard/milano-shell.tsx", "lib/dashboard-modules.ts"]);
const unsafeAffirmativePatterns = [
  /fake revenue/i,
  /fake payment status/i,
  /guaranteed acceptance(?![^.\n]*claim)/i,
  /government approved/i,
  /we provide legal advice/i,
  /we provide immigration advice/i,
  /internal margin/i,
];
for (const file of scannedFiles) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of unsafeAffirmativePatterns) {
    if (pattern.test(text)) {
      console.error(`Unsafe claim pattern ${pattern} found in ${file}`);
      process.exit(1);
    }
  }
}

console.log("Next three revenue ops validation passed.");
