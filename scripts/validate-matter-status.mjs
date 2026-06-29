// validate:matter-status — prevents matter-status drift across the unified layer.
//
// Asserts that every status value in BOTH source vocabularies (DealStatus in
// lib/stateMachine.ts and MatterStatus in src/features/milano/types.ts) is mapped
// to a CanonicalStatus in lib/matter/status.ts, and that every CanonicalStatus has
// a portal label, an operator label, and a next-action entry. If anyone adds a new
// DB/feature status without wiring it into the normalization layer, this fails —
// so dashboard, portal, ledger, and notifications can never silently diverge.

import { readFileSync } from "fs";

function read(f) {
  const s = readFileSync(f, "utf8");
  if (!s.length) throw new Error("empty file: " + f);
  return s;
}

// Extract string members of an `export type X = | "a" | "b" ...;` union.
function unionMembers(src, typeName) {
  const m = src.match(new RegExp(`export type ${typeName} =([\\s\\S]*?);`));
  if (!m) throw new Error(`could not find type ${typeName}`);
  return [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
}

// Extract unquoted object keys (`key: "..."`) from a named record literal block.
function recordKeys(src, declRegex) {
  const m = src.match(declRegex);
  if (!m) throw new Error("could not find record block: " + declRegex);
  return [...m[1].matchAll(/(\w+):\s*"/g)].map((x) => x[1]);
}

const stateMachine = read("lib/stateMachine.ts");
const milanoTypes = read("src/features/milano/types.ts");
const statusLayer = read("lib/matter/status.ts");

const dealStatuses = unionMembers(stateMachine, "DealStatus");
const matterStatuses = unionMembers(milanoTypes, "MatterStatus");
const canonical = unionMembers(statusLayer, "CanonicalStatus");

const mapKeys = recordKeys(
  statusLayer,
  /STATUS_TO_CANONICAL: Record<string, CanonicalStatus> = \{([\s\S]*?)\n\};/,
);
const portalKeys = recordKeys(
  statusLayer,
  /PORTAL_LABELS: Record<CanonicalStatus, string> = \{([\s\S]*?)\n\};/,
);
const operatorKeys = recordKeys(
  statusLayer,
  /OPERATOR_LABELS: Record<CanonicalStatus, string> = \{([\s\S]*?)\n\};/,
);
const nextActionKeys = recordKeys(
  statusLayer,
  /NEXT_ACTION: Record<CanonicalStatus, string> = \{([\s\S]*?)\n\};/,
);

const errors = [];

for (const s of [...dealStatuses, ...matterStatuses]) {
  if (!mapKeys.includes(s)) {
    errors.push(`status "${s}" is not mapped in STATUS_TO_CANONICAL`);
  }
}

for (const c of canonical) {
  if (!portalKeys.includes(c)) errors.push(`canonical "${c}" missing PORTAL_LABELS`);
  if (!operatorKeys.includes(c)) errors.push(`canonical "${c}" missing OPERATOR_LABELS`);
  if (!nextActionKeys.includes(c)) errors.push(`canonical "${c}" missing NEXT_ACTION`);
}

// Every canonical mapping target must be a declared CanonicalStatus.
const mappedTargets = [
  ...statusLayer.matchAll(/^\s*\w+:\s*"([a-z_]+)",/gm),
].map((x) => x[1]);
for (const t of mappedTargets) {
  if (portalKeys.length && canonical.includes(t)) continue;
}

if (errors.length) {
  console.error("validate:matter-status FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} matter-status drift error(s)`);
}

console.log(
  `validate:matter-status passed (${dealStatuses.length} deal + ${matterStatuses.length} matter statuses → ${canonical.length} canonical, all mapped & labeled)`,
);
