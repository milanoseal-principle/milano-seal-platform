export interface StateLivescanRule {
  method: "electronic_livescan";
  requiresOri: boolean;
  requiresAgencyInstruction: boolean;
  note: string;
}

export const STATE_LIVESCAN_RULE: StateLivescanRule = {
  method: "electronic_livescan",
  requiresOri: true,
  requiresAgencyInstruction: true,
  note: "State livescan submissions require ORI and agency instructions before submission.",
};

export function isLivescanReady(oriProvided: boolean, agencyInstructions: boolean): boolean {
  return oriProvided && agencyInstructions;
}
