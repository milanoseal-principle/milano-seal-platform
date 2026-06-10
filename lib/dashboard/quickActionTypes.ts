export type QuickActionGroup =
  | "Matter" | "Financial" | "Execution" | "Communications"
  | "Documents" | "Intelligence" | "Courier Custody" | "Release"
  | "Alliance" | "VA" | "Admin";

export type QuickActionStatus =
  | "READY" | "LOCKED" | "REVIEW_REQUIRED" | "DISABLED"
  | "NOT_MOUNTED" | "NO_MATTER_SELECTED";

export type QuickActionKind = "REVIEW" | "PREPARE" | "ROUTE" | "FLAG" | "LOCKED";

export type QuickActionRole =
  | "founder_admin" | "admin" | "operator" | "ops_manager"
  | "finance" | "va_operator" | "alliance_partner";

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  group: QuickActionGroup;
  kind: QuickActionKind;
  href: string;
  requiresMatter: boolean;
  appendMatterId?: boolean;
  roles: QuickActionRole[];
  status?: QuickActionStatus;
  disabledReason?: string;
  destructive?: boolean;
  preconditions?: string[];
}

export interface QuickActionContext {
  activeMatterId?: string;
  activeMatterRef?: string;
  role: QuickActionRole;
  mountedRoutes: string[];
  matterState?: string;
  paymentStatus?: string;
  executionStatus?: string;
  releaseStatus?: string;
}

export interface ResolvedQuickAction extends QuickAction {
  resolvedHref: string;
  resolvedStatus: QuickActionStatus;
  resolvedDisabledReason?: string;
  /** @deprecated use resolvedDisabledReason */
  resolvedReason?: string;
}
