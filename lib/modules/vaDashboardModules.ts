export const vaDashboardModules = [
  { id: "queue", label: "Task Queue", href: "/va/dashboard/queue", icon: "List" },
  { id: "matters", label: "Assigned Matters", href: "/va/dashboard/matters", icon: "FileText" },
  { id: "documents", label: "Documents", href: "/va/dashboard/documents", icon: "FolderOpen" },
  { id: "messages", label: "Messages", href: "/va/dashboard/messages", icon: "MessageSquare" },
];
  "assignedTasks",
  "matterPrepChecklist",
  "documentReadiness",
  "apostillePacketChecklist",
  "courierLabelChecklist",
  "followUpTemplates",
  "uploadStatus",
  "qaFlags",
  "taskCompletion",
] as const;

export type VADashboardModule = typeof vaDashboardModules[number];
