export interface AbandonedIntakeRecord { id: string; lastStep: string; destinationCountry?: string; nextAction: string; }
export const ABANDONED_INTAKE_QUEUE: AbandonedIntakeRecord[] = [{ id: "sample-no-client-data", lastStep: "destination", destinationCountry: "Italy", nextAction: "Send no-claim follow-up inviting completion of Secure Records Intake." }];
