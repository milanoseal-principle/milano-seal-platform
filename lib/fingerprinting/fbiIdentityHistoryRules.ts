export const FBI_IDENTITY_HISTORY_NOTE =
  "An FBI Identity History Summary is a personal record request and is not a substitute for an employment/licensing background check.";

export interface FbiIdentityHistoryRule {
  allowedForPersonalUse: boolean;
  allowedForForeignUse: boolean;
  substituteForEmploymentCheck: false;
  apostilleEligibleAfterResult: boolean;
}

export const FBI_IDENTITY_HISTORY_RULE: FbiIdentityHistoryRule = {
  allowedForPersonalUse: true,
  allowedForForeignUse: true,
  substituteForEmploymentCheck: false,
  apostilleEligibleAfterResult: true,
};
