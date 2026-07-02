import { INTERNAL_MODULES, type InternalModule, type InternalModuleRiskLevel, type InternalModuleStatus } from "./moduleRegistry";

export function getInternalModules(): InternalModule[] {
  return INTERNAL_MODULES;
}

export function getModulesBySection(section: InternalModule["section"]): InternalModule[] {
  return INTERNAL_MODULES.filter((module) => module.section === section);
}

export function getVisibleInternalModules(): InternalModule[] {
  return INTERNAL_MODULES.filter((module) => module.visibility !== "staged_only" && module.status !== "staged_only");
}

export function getStagedModules(): InternalModule[] {
  return INTERNAL_MODULES.filter((module) => module.status === "staged" || module.status === "staged_only" || module.visibility === "staged_only");
}

export function getModuleByHref(href: string): InternalModule | undefined {
  return INTERNAL_MODULES.find((module) => module.href === href);
}

export function getModuleStatusLabel(status: InternalModuleStatus): string {
  const labels: Record<InternalModuleStatus, string> = {
    live: "Live",
    staged: "Staged",
    planned: "Planned",
    blocked: "Blocked",
    staged_only: "Staged Only",
  };
  return labels[status];
}

export function getModuleRiskLabel(riskLevel: InternalModuleRiskLevel): string {
  const labels: Record<InternalModuleRiskLevel, string> = {
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk",
    payment_sensitive: "Payment Sensitive",
  };
  return labels[riskLevel];
}
