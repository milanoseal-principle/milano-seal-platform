export const clientPortalModules = [
  { id: "matters", label: "My Matters", href: "/portal/matters", icon: "FileText" },
  { id: "documents", label: "Documents", href: "/portal/documents", icon: "FolderOpen" },
  { id: "schedule", label: "Schedule", href: "/portal/schedule", icon: "Calendar" },
  { id: "messages", label: "Messages", href: "/portal/messages", icon: "MessageSquare" },
  { id: "payments", label: "Payments", href: "/portal/payments", icon: "CreditCard" },
];
  "matterTimeline",
  "invoiceStatus",
  "documentVault",
  "tracking",
  "nextSteps",
  "messages",
  "paidReleased",
] as const;

export type ClientPortalModule = typeof clientPortalModules[number];
