export interface AgencyInstructionPolicy {
  requiresAgencyInstruction: boolean;
  requiresOri: boolean;
  note: string;
}

export const AGENCY_INSTRUCTION_POLICY: AgencyInstructionPolicy = {
  requiresAgencyInstruction: true,
  requiresOri: true,
  note: "Employment and licensing submissions require agency instructions and an ORI before any submission.",
};

export function requiresAgencyInstruction(employmentOrLicensing: boolean): boolean {
  return employmentOrLicensing;
}
