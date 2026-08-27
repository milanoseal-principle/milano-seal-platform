import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const requiredModules = [
  ["lib/control-plane/architectureGovernance.ts", "control_plane_architecture_governance"],
  ["lib/international-execution/operationalGovernance.ts", "international_execution_governance"],
  ["lib/matter/matterTruthGovernance.ts", "matter_truth_view"],
  ["lib/intelligence/controlCenter.ts", "execution_reconciliation_center"],
  ["lib/alliance/executionGovernance.ts", "alliance_execution_governance"],
  ["lib/matter/evidenceLedger.ts", "matter_evidence_ledger"],
  ["lib/control-plane/liveAcceptance.ts", "live_acceptance_37_45"],
];

const registry = read("lib/control-plane/hardeningRegistry.ts");
for (const [file, id] of requiredModules) {
  if (!exists(file)) failures.push(`Architecture-significant module missing: ${file}`);
  if (!registry.includes(`id: \"${id}\"`)) failures.push(`Architecture-significant module is not registered: ${id}`);
}

const sensitiveFiles = [
  "lib/control-plane/architectureGovernance.ts",
  "lib/international-execution/operationalGovernance.ts",
  "lib/matter/matterTruthGovernance.ts",
  "lib/intelligence/controlCenter.ts",
  "lib/alliance/executionGovernance.ts",
  "lib/control-plane/hardeningRegistry.ts",
].map(read).join("\n");

if (/Stripe/i.test(sensitiveFiles)) failures.push("Hardening modules reintroduced prohibited Stripe language.");
if (/weighted\s+score|trust\s+score|best\s+partner|ranking\s+score/i.test(sensitiveFiles)) failures.push("Hardening modules contain prohibited synthetic scoring/ranking semantics.");
if (/mutationPolicy:\s*"governed_write"[\s\S]{0,250}execution_reconciliation_center/i.test(registry)) failures.push("Reconciliation intelligence gained write authority.");

const stateMachineDeclarations = [
  "data/matter-state-machine.ts",
  "lib/matter/stateAdapter.ts",
].filter(exists);
if (!stateMachineDeclarations.length) failures.push("Canonical Matter state machine source not found.");

const paymentAuthority = read("lib/control-plane/systemRegistry.ts");
const wiseAuthorityCount = (paymentAuthority.match(/id:\s*"wise_payment_authority"/g) ?? []).length;
if (wiseAuthorityCount !== 1) failures.push(`Expected exactly one Wise payment authority registry entry; found ${wiseAuthorityCount}.`);

const intelligence = read("lib/intelligence/controlCenter.ts");
if (/\.from\(|\.update\(|\.insert\(|\.upsert\(/.test(intelligence)) failures.push("Intelligence control center performs direct database mutation.");

if (failures.length) {
  console.error("Control Plane module coverage validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`PASS Control Plane module coverage: ${requiredModules.length} architecture-significant hardening modules are registered; no competing payment/state/intelligence authority detected.`);
