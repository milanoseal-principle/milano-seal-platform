import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["run", "typecheck", "--", "--pretty", "false"], {
  encoding: "utf8",
  env: { ...process.env, CI: "1" },
  shell: process.platform === "win32",
});
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
if ((result.status ?? 1) === 0) process.exit(0);

const first = output
  .split(/\r?\n/)
  .find((line) => /\.(?:ts|tsx)\(\d+,\d+\): error TS\d+/.test(line)) ?? "";

const groupA = [
  "lib/access-intent.ts","lib/activity.ts","lib/aiClassifier.ts","lib/allianceAuth.ts",
  "lib/allianceEligibility.ts","lib/animations.ts","lib/audit.ts","lib/authorityChainCertification.ts",
  "lib/authorityPack.ts","lib/automation.ts","lib/clientProjectionShield.ts","lib/commissionEngine.ts",
  "lib/compliance.ts","lib/complianceValidator.ts","lib/country-jsonld.ts","lib/custodyLedger.ts",
  "lib/dashboard-modules.ts","lib/dashboardAuth.ts","lib/dealBackup.ts","lib/dealId.ts",
  "lib/discountCodes.ts","lib/email.ts","lib/evidencePacket.ts","lib/evidenceStorage.ts",
  "lib/executionReadiness.ts","lib/followupEngine.ts","lib/format.ts","lib/gate.ts",
  "lib/hague-countries.ts","lib/incidentTypes.ts","lib/invoice.ts","lib/jurisdictions.ts",
  "lib/linking.ts","lib/logger.ts"
];
const groupB = [
  "lib/matterCriticality.ts","lib/matterIntelligence.ts","lib/matterRisk.ts","lib/messageEngine.ts",
  "lib/milanoSerialize.ts","lib/ocr.ts","lib/operatorActions.ts","lib/parseIntake.ts",
  "lib/pipelineEngine.ts","lib/portalAuth.ts","lib/portalInvoice.ts","lib/portalProjection.ts",
  "lib/pricing.ts","lib/protectedIdentifier.ts","lib/rbac.ts","lib/resource-guards.ts",
  "lib/scoringEngine.ts","lib/seo-data.ts","lib/seo-document-routing.ts","lib/seo-premium-corridors.ts",
  "lib/seo.ts","lib/shippo.ts","lib/signatureProof.ts","lib/slaEngine.ts","lib/slaMonitor.ts",
  "lib/stateMachine.ts","lib/supabaseClient.ts","lib/supabaseServer.ts","lib/twilio.ts","lib/utils.ts",
  "lib/vaAuth.ts","lib/vaTasks.ts","lib/validation.ts","lib/vault.ts","lib/webhookBus.ts",
  "lib/whatsapp.ts","lib/wise.ts"
];
if (groupA.some((file) => first.startsWith(file))) process.exit(131);
if (groupB.some((file) => first.startsWith(file))) process.exit(132);
process.exit(133);
