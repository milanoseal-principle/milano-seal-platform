import {
  CANONICAL_AUTHORITIES,
  PARENT_SYSTEMS,
  REGISTRY_CATEGORIES,
  SYSTEM_REGISTRY,
  type ParentSystem,
  type RegistryAudience,
  type RegistryCategory,
  type MutationPolicy,
} from "@/lib/control-plane/systemRegistry";

export interface PlacementProposal {
  id: string;
  name: string;
  parentSystem: ParentSystem;
  category: RegistryCategory;
  audiences: RegistryAudience[];
  authorityIds: string[];
  mutationPolicy: MutationPolicy;
  uxPlacement: string;
  sourcePaths: string[];
  validation: string[];
  duplicateKey: string;
}

export interface PlacementGateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  duplicateIds: string[];
}

function normalized(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function evaluateSystemPlacement(
  proposal: PlacementProposal,
): PlacementGateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const authorityIds = new Set(CANONICAL_AUTHORITIES.map((authority) => authority.id));

  if (!proposal.id.trim()) errors.push("Registry id is required.");
  if (!proposal.name.trim()) errors.push("Module name is required.");
  if (!PARENT_SYSTEMS.includes(proposal.parentSystem)) errors.push("Parent system is invalid.");
  if (!REGISTRY_CATEGORIES.includes(proposal.category)) errors.push("Registry category is invalid.");
  if (!proposal.audiences.length) errors.push("At least one audience is required.");
  if (!proposal.authorityIds.length) errors.push("At least one canonical/derived authority reference is required.");
  if (!proposal.uxPlacement.trim()) errors.push("UX placement or system-only placement is required.");
  if (!proposal.sourcePaths.length) errors.push("At least one source path is required.");
  if (!proposal.validation.length) errors.push("At least one validation gate is required.");
  if (!proposal.duplicateKey.trim()) errors.push("Duplicate key is required.");

  for (const authorityId of proposal.authorityIds) {
    if (!authorityIds.has(authorityId)) errors.push(`Unknown authority id: ${authorityId}`);
  }

  const duplicateIds = SYSTEM_REGISTRY.filter((entry) => {
    if (entry.id === proposal.id) return true;
    if (entry.duplicateKey === proposal.duplicateKey) return true;
    if (normalized(entry.name) === normalized(proposal.name)) return true;
    return Boolean(entry.route && entry.route === proposal.uxPlacement);
  }).map((entry) => entry.id);

  if (duplicateIds.length) {
    errors.push(`Equivalent registered capability already exists: ${duplicateIds.join(", ")}`);
  }

  if (
    proposal.parentSystem === "intelligence_control" &&
    proposal.mutationPolicy !== "read_only" &&
    proposal.category === "intelligence_surface"
  ) {
    errors.push("Intelligence surfaces must remain read-only unless promoted into an explicitly governed canonical engine.");
  }

  if (
    proposal.authorityIds.includes("payment") &&
    !proposal.sourcePaths.some((path) => path.includes("wise")) &&
    proposal.mutationPolicy !== "read_only"
  ) {
    errors.push("Payment-mutating capability must bind to the canonical Wise authority path.");
  }

  if (proposal.category === "future_dormant" && proposal.mutationPolicy !== "none") {
    warnings.push("Future/dormant capability should normally have mutationPolicy=none until activated.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    duplicateIds,
  };
}

export function assertSystemRegistryIntegrity() {
  const errors: string[] = [];
  const ids = new Set<string>();
  const duplicateKeys = new Set<string>();
  const authorityIds = new Set(CANONICAL_AUTHORITIES.map((authority) => authority.id));

  for (const entry of SYSTEM_REGISTRY) {
    if (ids.has(entry.id)) errors.push(`Duplicate registry id: ${entry.id}`);
    ids.add(entry.id);

    if (duplicateKeys.has(entry.duplicateKey)) errors.push(`Duplicate registry duplicateKey: ${entry.duplicateKey}`);
    duplicateKeys.add(entry.duplicateKey);

    if (!entry.sourcePaths.length) errors.push(`${entry.id} has no source paths.`);
    if (!entry.validation.length) errors.push(`${entry.id} has no validation gate.`);
    if (!entry.audiences.length) errors.push(`${entry.id} has no audience.`);

    for (const authorityId of entry.authorityIds) {
      if (!authorityIds.has(authorityId)) errors.push(`${entry.id} references unknown authority: ${authorityId}`);
    }

    if (
      entry.category === "intelligence_surface" &&
      entry.parentSystem === "intelligence_control" &&
      entry.mutationPolicy !== "read_only"
    ) {
      errors.push(`${entry.id} is an intelligence surface with mutation authority.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    count: SYSTEM_REGISTRY.length,
  };
}
