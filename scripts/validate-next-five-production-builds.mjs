import fs from "node:fs";
import { spawnSync } from "node:child_process";

const groups = {
  acquisition: ["lib/acquisition/types.ts", "lib/acquisition/leadScoring.ts", "lib/acquisition/dynamicCtaEngine.ts", "lib/acquisition/referralCapture.ts", "lib/acquisition/abandonedIntake.ts", "lib/acquisition/acquisitionSafety.ts", "components/acquisition/AcquisitionCommandCenter.tsx", "components/acquisition/LeadScoreCard.tsx", "components/acquisition/DynamicCTA.tsx", "components/acquisition/ReferralSourcePanel.tsx", "components/acquisition/AbandonedIntakeQueue.tsx", "components/acquisition/FounderReviewQueue.tsx", "app/dashboard/acquisition/page.tsx"],
  portal2: ["lib/portal2/types.ts", "lib/portal2/matterTimeline.ts", "lib/portal2/statusRail.ts", "app/portal/documents/page.tsx", "lib/portal2/portalSafety.ts", "components/portal2/ClientPortalShell.tsx", "components/portal2/MatterTimeline.tsx", "components/portal2/LiveStatusRail.tsx", "components/portal2/DocumentVaultPanel.tsx", "components/portal2/InvoiceCenterPanel.tsx", "components/portal2/UploadCenterPanel.tsx", "components/portal2/ExecutionChecklistPanel.tsx", "components/portal2/CourierTrackingPanel.tsx", "components/portal2/ApostilleTimelinePanel.tsx", "components/portal2/RONTimelinePanel.tsx", "components/portal2/CountryReadinessPanel.tsx", "components/portal2/FinalReleaseVault.tsx", "components/portal2/CompletionCertificate.tsx", "app/portal/v2/page.tsx"],
  jurisdictions: ["lib/jurisdictions/types.ts", "lib/jurisdictions/countryRegistry.ts", "lib/jurisdictions/hagueStatus.ts", "lib/jurisdictions/embassyRegistry.ts", "lib/jurisdictions/consulateRegistry.ts", "lib/jurisdictions/translationRules.ts", "lib/jurisdictions/processingNotes.ts", "lib/jurisdictions/manualReviewFlags.ts", "lib/jurisdictions/jurisdictionSafety.ts", "components/jurisdictions/JurisdictionCommandCenter.tsx", "components/jurisdictions/CountryEditor.tsx", "components/jurisdictions/HagueStatusPanel.tsx", "components/jurisdictions/EmbassyConsulatePanel.tsx", "components/jurisdictions/ManualReviewFlags.tsx", "components/jurisdictions/DestinationRequirements.tsx", "app/dashboard/jurisdictions/page.tsx", "app/countries/[country]/page.tsx"],
  founder: ["lib/founder-os/types.ts", "lib/founder-os/dailyCommand.ts", "lib/founder-os/followUpEngine.ts", "lib/founder-os/revenueReview.ts", "lib/founder-os/contentQueue.ts", "lib/founder-os/founderSafety.ts", "components/founder/FounderCommandCenter.tsx", "components/founder/DailyRevenuePanel.tsx", "components/founder/PendingQuotesPanel.tsx", "components/founder/FounderFollowUps.tsx", "components/founder/HighValueMatterQueue.tsx", "components/founder/AttorneyPipeline.tsx", "components/founder/PartnerPipeline.tsx", "components/founder/GovernmentOpportunityQueue.tsx", "components/founder/InternationalOpportunityQueue.tsx", "components/founder/MarketingQueue.tsx", "components/founder/ContentQueue.tsx", "components/founder/WeeklyKPIReview.tsx", "components/founder/MonthlyRevenueReview.tsx", "app/dashboard/founder/page.tsx"],
  dispatch: ["lib/dispatch/types.ts", "app/api/alliance/partner/route.ts", "lib/dispatch/partnerVerification.ts", "lib/dispatch/partnerPassport.ts", "lib/dispatch/trustScore.ts", "lib/dispatch/coverageMap.ts", "lib/dispatch/availability.ts", "app/api/dispatch/jobs/route.ts", "lib/dispatch/assignmentWorkflow.ts", "lib/dispatch/completionReview.ts", "lib/dispatch/qaReview.ts", "lib/dispatch/partnerPaymentQueue.ts", "lib/dispatch/dispatchSafety.ts", "components/dispatch/AllianceDispatchCommandCenter.tsx", "components/dispatch/PartnerApplicationQueue.tsx", "components/dispatch/PartnerVerificationPanel.tsx", "components/dispatch/PartnerPassportPanel.tsx", "components/dispatch/TrustScorePanel.tsx", "components/dispatch/CoverageMapPanel.tsx", "components/dispatch/AvailabilityBoard.tsx", "components/dispatch/DispatchQueue.tsx", "components/dispatch/AssignmentWorkflow.tsx", "components/dispatch/CompletionReviewPanel.tsx", "components/dispatch/QAReviewPanel.tsx", "components/dispatch/PartnerPaymentQueue.tsx", "components/dispatch/FounderApprovalPanel.tsx", "app/dashboard/dispatch/page.tsx"],
};

const failures = [];
const files = Object.values(groups).flat();
for (const file of files) if (!fs.existsSync(file)) failures.push(`Missing required file: ${file}`);

const compatibility = fs.readFileSync("app/portal/v2/page.tsx", "utf8");
if (!/redirect\("\/portal"\)/.test(compatibility)) failures.push("Legacy portal must forward to canonical portal");
const documents = fs.readFileSync("app/portal/documents/page.tsx", "utf8");
if (!documents.includes("usePortal") || !documents.includes("/api/portal/me/documents?deal_id=")) failures.push("Canonical document portal must retain authorized storage workflow");
const documentApi = fs.readFileSync("app/api/portal/me/documents/route.ts", "utf8");
if (!documentApi.includes("getAllClientDeals()") || !documentApi.includes("getVaultDocumentsForMatter")) failures.push("Document API must preserve client ownership and signed vault access");
const partner = fs.readFileSync("app/api/alliance/partner/route.ts", "utf8");
if (!partner.includes("auth.getUser()") || !partner.includes('.eq("user_id", user.id)')) failures.push("Partner profile must remain owner-scoped");
const jobs = fs.readFileSync("app/api/dispatch/jobs/route.ts", "utf8");
if (!jobs.includes("requireDispatchOperator")) failures.push("Canonical dispatch queue must require operator authorization");
const requiredRoutes = ["app/dashboard/acquisition/page.tsx", "app/portal/v2/page.tsx", "app/dashboard/jurisdictions/page.tsx", "app/dashboard/founder/page.tsx", "app/dashboard/dispatch/page.tsx"];
for (const route of requiredRoutes) if (!fs.existsSync(route)) failures.push(`Missing route: ${route}`);

const combined = files.filter((file) => fs.existsSync(file)).map((file) => fs.readFileSync(file, "utf8")).join("\n");
for (const phrase of ["guaranteed acceptance", "government approved", "legal advice", "immigration advice"]) {
  if (combined.includes(`We provide ${phrase}`) || combined.includes(`provides ${phrase}`)) failures.push(`Unsafe affirmative claim: ${phrase}`);
}

const changed = process.env.VERCEL === "1" ? "" : run("git", ["diff", "--name-only", "HEAD~1..HEAD"]);
const protectedPatterns = [/^app\/api\/webhooks?\/wise/, /^app\/api\/webhook\/wise/, /^app\/api\/deals\/.*payment/, /^app\/api\/deals\/.*release/, /^src\/features\/payments\//, /^src\/features\/release\//, /^src\/features\/ledger\//, /^lib\/wise/, /^lib\/supabase/, /^src\/features\/shipping\//, /^src\/features\/execution\/blueNotaryAdapter/];
for (const file of changed.split("\n").filter(Boolean)) if (protectedPatterns.some((pattern) => pattern.test(file))) failures.push(`Protected file changed: ${file}`);

if (failures.length) { console.error("Next five production builds validation failed:"); for (const failure of failures) console.error(`- ${failure}`); process.exit(1); }
console.log("Next five production builds validation passed.");

function run(command, args) { return spawnSync(command, args, { encoding: "utf8" }).stdout ?? ""; }
