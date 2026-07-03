export interface ApostilleSupportEntry {
  id: string;
  label: string;
  publicSummary: string;
  level: "state" | "federal" | "consular" | "manual_review";
}

export const apostilleAuthenticationSupportRegistry: ApostilleSupportEntry[] = [
  {
    id: "state-apostille",
    label: "State Apostille Coordination",
    publicSummary: "Apostille coordination through issuing-state authorities.",
    level: "state",
  },
  {
    id: "federal-authentication",
    label: "Federal Authentication Coordination",
    publicSummary: "Federal authentication routing for federal-issued documents.",
    level: "federal",
  },
  {
    id: "consular-legalization",
    label: "Consular Legalization Coordination",
    publicSummary:
      "Coordination support for consular legalization when a destination is outside apostille routing.",
    level: "consular",
  },
];

export function getApostilleSupport(id: string): ApostilleSupportEntry | undefined {
  return apostilleAuthenticationSupportRegistry.find((entry) => entry.id === id);
}
