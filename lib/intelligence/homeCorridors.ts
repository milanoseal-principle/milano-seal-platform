import type { Destination } from "@/data/destinations";

export type HomeCorridorRiskFlag =
  | "translation_review"
  | "receiving_authority_requirements"
  | "signer_document_mismatch"
  | "consular_legalization"
  | "manual_review_required"
  | "courier_selection_pending";

export type HomeCorridorRouteType =
  | "apostille"
  | "legalization"
  | "domestic"
  | "manual_review";

export interface HomeExecutionCorridor {
  country: string;
  slug: string;
  flag: string;
  origin: "Florida, United States";
  hagueMember: boolean;
  routeType: HomeCorridorRouteType;
  stateAuthority: string;
  authenticationPath: string;
  courierMode: string;
  custodyStatus: string;
  releaseTrigger: string;
  riskFlags: HomeCorridorRiskFlag[];
  corridorSteps: string[];
  intakeHref: string;
  lat: number;
  lng: number;
}

export const FLORIDA_ORIGIN = { lat: 27.6648, lng: -81.5158 };

export function buildHomeCorridor(d: Destination): HomeExecutionCorridor {
  const executionText = d.executionPath.join(" ").toLowerCase();
  const hasTranslation = executionText.includes("translation");

  const riskFlags: HomeCorridorRiskFlag[] = [
    "receiving_authority_requirements",
    "courier_selection_pending",
  ];
  if (hasTranslation) riskFlags.push("translation_review");
  if (!d.hague) {
    riskFlags.push("consular_legalization");
    riskFlags.push("manual_review_required");
  }

  const corridorSteps = d.hague
    ? [
        "Florida Origin",
        "RON / Notarial Execution",
        "Florida Department of State Apostille",
        "Secure Courier Release",
        `${d.name} Receiving Authority / Client Counsel`,
      ]
    : [
        "Florida Origin",
        "Notarial Execution",
        "State Authentication Review",
        "Consular / Legalization Review",
        `${d.name} Receiving Authority / Client Counsel`,
      ];

  return {
    country: d.name,
    slug: d.slug,
    flag: d.flag,
    origin: "Florida, United States",
    hagueMember: d.hague,
    routeType: d.hague ? "apostille" : "legalization",
    stateAuthority: d.hague
      ? "Florida Department of State"
      : "Florida Department of State / Consular Review",
    authenticationPath: d.hague
      ? "Hague Apostille"
      : "Manual legalization review required",
    courierMode: d.hague
      ? "DHL / FedEx / UPS document courier"
      : "Courier selection after route confirmation",
    custodyStatus: d.hague
      ? "Not started until payment and execution are complete"
      : "Not started until manual review is complete",
    releaseTrigger: d.hague
      ? "Paid & Released"
      : "Paid & Released after approved route",
    riskFlags,
    corridorSteps,
    intakeHref: `/intake?destination=${d.slug}&origin=florida`,
    lat: d.lat ?? 0,
    lng: d.lng ?? 0,
  };
}
