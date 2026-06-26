export const allianceDashboardModules = [
  { id: "referrals", label: "Referrals", href: "/alliance/dashboard/referrals", icon: "Share2" },
  { id: "earnings", label: "Earnings", href: "/alliance/dashboard/earnings", icon: "TrendingUp" },
  { id: "materials", label: "Materials", href: "/alliance/dashboard/materials", icon: "Package" },
  { id: "profile", label: "Profile", href: "/alliance/dashboard/profile", icon: "User" },
];
  "referralSubmit",
  "referralStatus",
  "onboardingStatus",
  "toolbeltChecklist",
  "complianceReadiness",
  "partnerResources",
  "approvedScripts",
  "trainingLinks",
  "referralPayoutStatus",
] as const;

export type AllianceDashboardModule = typeof allianceDashboardModules[number];
