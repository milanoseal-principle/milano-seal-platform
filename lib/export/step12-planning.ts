export const STEP12_SUPPORT = {
  travelReimbursementMaxUsd: 2500,
  translationReimbursementMaxUsd: 500,
  comprehensiveExportMarketingPlanValueUsd: 7500,
  comprehensiveExportMarketingPlanClientContributionUsd: 500,
  comprehensiveExportMarketingPlanStateSupportUsd: 7000,
  websiteLocalizationMaxUsd: 2100,
  internationalCompanyProfileMaxUsd: 600,
  customizedMarketResearchRateUsdPerHour: 45,
  exploratoryEmpReimbursementCapTwoYearsUsd: 2000,
  comprehensiveEmpReimbursementCapTwoYearsUsd: 8000,
  comprehensiveEmpTotalSupportedValueTwoYearsUsd: 15000,
  minimumOperatingYearsGeneral: 1,
  minimumDomesticBusinessYearsComprehensiveEmp: 2,
} as const;

export type Step12PlanningStatus =
  | "NEEDS_REVIEW"
  | "NOT_YET_ELIGIBLE"
  | "POTENTIALLY_ELIGIBLE";

export interface Step12PlanningInput {
  operatingYears?: number;
  domesticBusinessYears?: number;
  usOrganizedAndOperating?: boolean;
  meetsSbaSmallBusinessStandard?: boolean;
  hasTradeCostResources?: boolean;
  activeFloridaCorporation?: boolean;
  feinLinkedToFloridaAddress?: boolean;
  valueAddedInFlorida?: boolean;
  newToExportOrExpandingMarket?: boolean;
  seekingComprehensiveEmp?: boolean;
}

export interface Step12PlanningResult {
  status: Step12PlanningStatus;
  missingFacts: string[];
  blockingFacts: string[];
  notes: string[];
  maximumPlanningValueUsd: number | null;
}

const REQUIRED_BOOLEAN_FIELDS: Array<{
  key: keyof Step12PlanningInput;
  label: string;
}> = [
  { key: "usOrganizedAndOperating", label: "U.S.-organized and operating status" },
  { key: "meetsSbaSmallBusinessStandard", label: "SBA small-business size status" },
  { key: "hasTradeCostResources", label: "Resources to bear trade-related costs" },
  { key: "activeFloridaCorporation", label: "Active Florida corporation status" },
  { key: "feinLinkedToFloridaAddress", label: "FEIN tied to a Florida address" },
  { key: "valueAddedInFlorida", label: "Florida value-add qualification" },
  { key: "newToExportOrExpandingMarket", label: "New-to-export or foreign-market expansion status" },
];

export function evaluateStep12Planning(input: Step12PlanningInput): Step12PlanningResult {
  const missingFacts: string[] = [];
  const blockingFacts: string[] = [];
  const notes: string[] = [
    "Planning result only. Final eligibility is determined by the applicable Florida export-assistance program process.",
    "Reimbursement cannot exceed eligible actual costs incurred and remains subject to approval and current program limits.",
  ];

  for (const field of REQUIRED_BOOLEAN_FIELDS) {
    const value = input[field.key];
    if (typeof value !== "boolean") missingFacts.push(field.label);
    else if (value === false) blockingFacts.push(field.label);
  }

  if (typeof input.operatingYears !== "number") {
    missingFacts.push("Operating history");
  } else if (input.operatingYears < STEP12_SUPPORT.minimumOperatingYearsGeneral) {
    blockingFacts.push("At least one year in business is required for the general STEP eligibility gate");
  }

  if (input.seekingComprehensiveEmp) {
    if (typeof input.domesticBusinessYears !== "number") {
      missingFacts.push("Domestic business history for Comprehensive EMP");
    } else if (
      input.domesticBusinessYears < STEP12_SUPPORT.minimumDomesticBusinessYearsComprehensiveEmp
    ) {
      blockingFacts.push("Comprehensive EMP requires at least two years in domestic business");
    }
  }

  if (blockingFacts.length) {
    return {
      status: "NOT_YET_ELIGIBLE",
      missingFacts,
      blockingFacts,
      notes,
      maximumPlanningValueUsd: null,
    };
  }

  if (missingFacts.length) {
    return {
      status: "NEEDS_REVIEW",
      missingFacts,
      blockingFacts,
      notes,
      maximumPlanningValueUsd: null,
    };
  }

  return {
    status: "POTENTIALLY_ELIGIBLE",
    missingFacts,
    blockingFacts,
    notes,
    maximumPlanningValueUsd: input.seekingComprehensiveEmp
      ? STEP12_SUPPORT.comprehensiveEmpTotalSupportedValueTwoYearsUsd
      : STEP12_SUPPORT.exploratoryEmpReimbursementCapTwoYearsUsd,
  };
}
