// Typed capability statement model + builder. Produces a structured object only.
// pastPerformance may be EMPTY — we never fabricate past performance or clients.

export interface CapabilityCompanyData {
  legalName: string;
  entityType: string;
  location: string;
  notaryCommission: string;
  ronAuthorized: boolean;
  duns?: string;
  uei?: string;
  cage?: string;
  email: string;
  phone: string;
}

export interface PastPerformanceEntry {
  agency: string;
  scope: string;
  period: string;
  reference: string;
}

export interface CapabilityStatement {
  coreCompetencies: string[];
  differentiators: string[];
  naicsCodes: string[];
  pastPerformance: PastPerformanceEntry[]; // allowed to be empty
  companyData: CapabilityCompanyData;
}

export interface CapabilityStatementInput {
  coreCompetencies?: string[];
  differentiators?: string[];
  naicsCodes?: string[];
  pastPerformance?: PastPerformanceEntry[];
  companyData: CapabilityCompanyData;
}

const DEFAULT_CORE_COMPETENCIES = [
  "Remote online notarization (eligible documents)",
  "Mobile document execution coordination",
  "Apostille & authentication coordination",
  "Identity verification & witness coordination",
  "Secure document handling and release tracking",
];

const DEFAULT_DIFFERENTIATORS = [
  "Payment-gated, custody-aware execution workflow",
  "Structured intake with receiving-authority awareness",
  "International document release coordination",
];

export function buildCapabilityStatement(
  input: CapabilityStatementInput,
): CapabilityStatement {
  return {
    coreCompetencies:
      input.coreCompetencies && input.coreCompetencies.length > 0
        ? input.coreCompetencies
        : [...DEFAULT_CORE_COMPETENCIES],
    differentiators:
      input.differentiators && input.differentiators.length > 0
        ? input.differentiators
        : [...DEFAULT_DIFFERENTIATORS],
    naicsCodes: input.naicsCodes ?? [],
    // No fabrication: only include what the operator supplies.
    pastPerformance: input.pastPerformance ?? [],
    companyData: input.companyData,
  };
}
