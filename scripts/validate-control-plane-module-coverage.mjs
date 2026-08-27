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
  ["lib/matter/matterTruthArchive.ts", "matter_truth_snapshot_archive"],
  ["lib/matter/outputEnvelope.ts", "matter_output_envelopes"],
  ["lib/matter/evidenceIngestion.ts", "matter_evidence_reconciliation"],
  ["lib/matter/provenanceMatrix.ts", "matter_provenance_matrix"],
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
  "lib/matter/matterTruthArchive.ts",
  "lib/matter/outputEnvelope.ts",
  "lib/matter/evidenceIngestion.ts",
  "lib/matter/provenanceMatrix.ts",
  "lib/intelligence/controlCenter.ts",
  "lib/alliance/executionGovernance.ts",
  "lib/control-plane/hardeningRegistry.ts",
].map(read).join("\n");

if (/Stripe/i.test(sensitiveFiles)) failures.push("Hardening modules reintroduced prohibited Stripe language.");
if (/weighted\s+score|trust\s+score|best\s+partner|ranking\s+score/i.test(sensitiveFiles)) failures.push("Hardening modules contain prohibited synthetic scoring/ranking semantics.");
if (/mutationPolicy:\s*"governed_write"[\s\S]{0,250}execution_reconciliation_center/i.test(registry)) failures.push("Reconciliation intelligence gained write authority.");

for (const file of [
  "lib/matter/matterTruthArchive.ts",
  "lib/matter/outputEnvelope.ts",
  "lib/matter/evidenceIngestion.ts",
  "lib/matter/provenanceMatrix.ts",
  "lib/intelligence/controlCenter.ts",
]) {
  const source = read(file);
  if (/\.from\(|\.update\(|\.insert\(|\.upsert\(|createAdminClient|createClient\(/.test(source)) {
    failures.push(`Derived Matter intelligence module performs direct persistence/auth access: ${file}`);
  }
}

const stateMachineDeclarations = [
  "data/matter-state-machine.ts",
  "lib/matter/stateAdapter.ts",
].filter(exists);
if (!stateMachineDeclarations.length) failures.push("Canonical Matter state machine source not found.");

const paymentAuthority = read("lib/control-plane/systemRegistry.ts");
const wiseAuthorityCount = (paymentAuthority.match(/id:\s*"wise_payment_authority"/g) ?? []).length;
if (wiseAuthorityCount !== 1) failures.push(`Expected exactly one Wise payment authority registry entry; found ${wiseAuthorityCount}.`);

if (failures.length) {
  console.error("Control Plane module coverage validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`PASS Control Plane module coverage: ${requiredModules.length} architecture-significant hardening modules are registered; no competing payment/state/intelligence authority detected.`);
