export type MatterOpsCheck = {
  key: string;
  label: string;
  required: boolean;
  damianiIdentifierCheck?: boolean;
};

export type MatterReadiness = {
  matterId: string;
  paymentConfirmed: boolean;
  qaComplete: boolean;
  executionComplete: boolean;
  releaseEligible: boolean;
  blockers: string[];
};
