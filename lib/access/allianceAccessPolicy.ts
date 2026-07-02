export const ALLIANCE_ALLOWED = ["view_own_profile", "view_training_materials", "view_toolbelt_status", "view_compliance_readiness", "view_public_referral_guidelines"] as const;
export const ALLIANCE_BLOCKED = ["payment_release", "wise_reconciliation", "custody_release", "client_cross_access", "unrelated_matters", "internal_margin", "discount_override", "comp_clear", "final_release_override"] as const;
export const ALLIANCE_DISPATCH_STATUS = "staged_only_operator_approved" as const;
export const ALLIANCE_PUBLIC_PROMISES = { fakeMemberCounts: false, guaranteedIncome: false, instantApproval: false, dealVolumePromises: false } as const;
