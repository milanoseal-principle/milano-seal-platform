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

const files = [
  ["lib/access-intent.ts", 140],
  ["lib/activity.ts", 141],
  ["lib/aiClassifier.ts", 142],
  ["lib/allianceAuth.ts", 143],
  ["lib/allianceEligibility.ts", 144],
  ["lib/animations.ts", 145],
  ["lib/audit.ts", 146],
  ["lib/authorityChainCertification.ts", 147],
  ["lib/authorityPack.ts", 148],
  ["lib/automation.ts", 149],
  ["lib/clientProjectionShield.ts", 150],
  ["lib/commissionEngine.ts", 151],
  ["lib/compliance.ts", 152],
  ["lib/complianceValidator.ts", 153],
  ["lib/country-jsonld.ts", 154],
  ["lib/custodyLedger.ts", 155],
  ["lib/dashboard-modules.ts", 156],
  ["lib/dashboardAuth.ts", 157],
  ["lib/dealBackup.ts", 158],
  ["lib/dealId.ts", 159],
  ["lib/discountCodes.ts", 160],
  ["lib/email.ts", 161],
  ["lib/evidencePacket.ts", 162],
  ["lib/evidenceStorage.ts", 163],
  ["lib/executionReadiness.ts", 164],
  ["lib/followupEngine.ts", 165],
  ["lib/format.ts", 166],
  ["lib/gate.ts", 167],
  ["lib/hague-countries.ts", 168],
  ["lib/incidentTypes.ts", 169],
  ["lib/invoice.ts", 170],
  ["lib/jurisdictions.ts", 171],
  ["lib/linking.ts", 172],
  ["lib/logger.ts", 173],
  ["lib/matterCriticality.ts", 174],
  ["lib/matterIntelligence.ts", 175],
  ["lib/matterRisk.ts", 176],
  ["lib/messageEngine.ts", 177],
  ["lib/milanoSerialize.ts", 178],
  ["lib/ocr.ts", 179],
  ["lib/operatorActions.ts", 180],
  ["lib/parseIntake.ts", 181],
  ["lib/pipelineEngine.ts", 182],
  ["lib/portalAuth.ts", 183],
  ["lib/portalInvoice.ts", 184],
  ["lib/portalProjection.ts", 185],
  ["lib/pricing.ts", 186],
  ["lib/protectedIdentifier.ts", 187],
  ["lib/rbac.ts", 188],
  ["lib/resource-guards.ts", 189],
  ["lib/scoringEngine.ts", 190],
  ["lib/seo-data.ts", 191],
  ["lib/seo-document-routing.ts", 192],
  ["lib/seo-premium-corridors.ts", 193],
  ["lib/seo.ts", 194],
  ["lib/shippo.ts", 195],
  ["lib/signatureProof.ts", 196],
  ["lib/slaEngine.ts", 197],
  ["lib/slaMonitor.ts", 198],
  ["lib/stateMachine.ts", 199],
  ["lib/supabaseClient.ts", 200],
  ["lib/supabaseServer.ts", 201],
  ["lib/twilio.ts", 202],
  ["lib/utils.ts", 203],
  ["lib/vaAuth.ts", 204],
  ["lib/vaTasks.ts", 205],
  ["lib/validation.ts", 206],
  ["lib/vault.ts", 207],
  ["lib/webhookBus.ts", 208],
  ["lib/whatsapp.ts", 209],
  ["lib/wise.ts", 210]
];
for (const [file, code] of files) {
  if (first.startsWith(file)) process.exit(code);
}
process.exit(230);
