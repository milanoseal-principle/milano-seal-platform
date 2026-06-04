"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  DollarSign,
  Zap,
  Package,
  FolderOpen,
  Globe,
  Users,
  Settings,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                                 */
/* ------------------------------------------------------------------ */

type ActionStatus = "READY" | "BLOCKED" | "REVIEW_REQUIRED" | "DISABLED";

interface ActionDef {
  label: string;
  route: string;
  requiresMatter?: boolean;
  requiresPayment?: boolean;
  notMounted?: boolean;
}

interface GroupDef {
  id: string;
  label: string;
  icon: React.ElementType;
  actions: ActionDef[];
}

/* ------------------------------------------------------------------ */
/* Group definitions                                                     */
/* ------------------------------------------------------------------ */

const GROUPS: GroupDef[] = [
  {
    id: "matter",
    label: "Matter",
    icon: FileText,
    actions: [
      { label: "Open Matter Registry", route: "/dashboard/deals" },
      { label: "Create Matter", route: "/intake" },
      { label: "Review Active Matter", route: "/dashboard/deals/[id]", requiresMatter: true },
      { label: "Matter Pipeline", route: "/dashboard/pipeline" },
    ],
  },
  {
    id: "financial",
    label: "Financial",
    icon: DollarSign,
    actions: [
      { label: "Payment Gate", route: "/dashboard/payments", requiresMatter: true },
      { label: "Invoice Studio", route: "/dashboard/invoices", requiresMatter: true },
      { label: "Wise Reconciliation", route: "/dashboard/payments?filter=review_required" },
      { label: "Open Balances", route: "/dashboard/payments?filter=awaiting_payment" },
    ],
  },
  {
    id: "execution",
    label: "Execution",
    icon: Zap,
    actions: [
      { label: "Schedule Execution", route: "/dashboard/scheduling", requiresMatter: true },
      { label: "Execution Checklist", route: "/dashboard/deals/[id]?tab=execution", requiresMatter: true },
      { label: "Signing Room", route: "/dashboard/ron", requiresMatter: true },
      { label: "Apostille Queue", route: "/dashboard/apostille", requiresMatter: true },
      { label: "Release Desk", route: "/dashboard/releases", requiresMatter: true },
    ],
  },
  {
    id: "courier",
    label: "Courier Custody",
    icon: Package,
    actions: [
      { label: "Custody Rail", route: "/dashboard/shipping", requiresMatter: true },
      { label: "Validate Address", route: "/dashboard/shipping", requiresMatter: true },
      { label: "Preview Rates", route: "/dashboard/shipping", requiresMatter: true },
      { label: "Purchase Label", route: "/dashboard/shipping", requiresMatter: true },
      { label: "Delivered Not Released", route: "/dashboard/releases?filter=delivered_not_released" },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    icon: FolderOpen,
    actions: [
      { label: "The Vault", route: "/dashboard/documents", requiresMatter: true },
      { label: "Upload Documents", route: "/dashboard/documents/upload", requiresMatter: true },
      { label: "Certificate Library", route: "/dashboard/certificates", requiresMatter: true },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: Globe,
    actions: [
      { label: "Global Document Intelligence", route: "/map" },
      { label: "Atlas", route: "/map" },
      { label: "Authority Graph", route: "/dashboard/authority-graph", notMounted: true },
      { label: "Truth Engine", route: "/dashboard/truth", notMounted: true },
      { label: "Institutional Memory", route: "/dashboard/memory", notMounted: true },
    ],
  },
  {
    id: "alliance",
    label: "Alliance / Revenue",
    icon: Users,
    actions: [
      { label: "Alliance Desk", route: "/alliance/dashboard", notMounted: true },
      { label: "Referral Ledger", route: "/dashboard/referrals", notMounted: true },
      { label: "Revenue Desk", route: "/dashboard/revenue", notMounted: true },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Settings,
    actions: [
      { label: "Operations Desk", route: "/va/dashboard", notMounted: true },
      { label: "Operational Ledger", route: "/dashboard/terminal" },
      { label: "Control Room", route: "/dashboard/admin" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Courier-specific action suffixes                                      */
/* ------------------------------------------------------------------ */
const COURIER_ACTION_PARAMS: Record<string, string> = {
  "Validate Address": "&action=validate_address",
  "Preview Rates": "&action=preview_rates",
  "Purchase Label": "&action=purchase_label",
};

/* ------------------------------------------------------------------ */
/* Route resolution                                                      */
/* ------------------------------------------------------------------ */

function resolveRoute(action: ActionDef, matterId?: string): string {
  const courierSuffix = COURIER_ACTION_PARAMS[action.label] ?? "";
  let base = action.route;

  // Replace [id] segment with actual matterId (or strip if no matterId)
  if (base.includes("[id]")) {
    if (matterId) {
      base = base.replace("[id]", matterId);
    } else {
      // fallback: strip [id] segment + query entirely
      base = base.replace("/[id]", "").split("?")[0];
      return base;
    }
    // Route already resolved with [id]; return as-is (may have ?tab= etc.)
    return base;
  }

  // Courier actions: append action param after matter_id
  if (courierSuffix) {
    if (matterId) return `${base}?matter_id=${matterId}${courierSuffix}`;
    return base;
  }

  // Routes that already have a query string
  if (base.includes("?")) {
    return matterId && action.requiresMatter
      ? `${base}&matter_id=${matterId}`
      : base;
  }

  if (matterId && action.requiresMatter) {
    return `${base}?matter_id=${matterId}`;
  }
  return base;
}

/* ------------------------------------------------------------------ */
/* Status resolution                                                     */
/* ------------------------------------------------------------------ */

function resolveStatus(
  action: ActionDef,
  matterId?: string
): { status: ActionStatus; tooltip: string } {
  if (action.notMounted) {
    return { status: "DISABLED", tooltip: "Module not mounted yet" };
  }
  if (action.requiresMatter && !matterId) {
    return { status: "DISABLED", tooltip: "Select a matter first" };
  }
  if (action.requiresPayment && !matterId) {
    return { status: "BLOCKED", tooltip: "Payment requires active matter" };
  }
  return { status: "READY", tooltip: "" };
}

/* ------------------------------------------------------------------ */
/* Status pill styles                                                    */
/* ------------------------------------------------------------------ */

const STATUS_PILL: Record<ActionStatus, { bg: string; color: string; label: string }> = {
  READY: { bg: "rgba(197,160,89,0.12)", color: "#C5A059", label: "READY" },
  BLOCKED: { bg: "rgba(100,116,139,0.18)", color: "#94a3b8", label: "BLOCKED" },
  REVIEW_REQUIRED: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "REVIEW" },
  DISABLED: { bg: "rgba(80,80,80,0.15)", color: "#6b7280", label: "DISABLED" },
};

/* ------------------------------------------------------------------ */
/* Props                                                                 */
/* ------------------------------------------------------------------ */

export interface QuickActionIntelligenceMenuProps {
  activeMatterId?: string;
}

/* ------------------------------------------------------------------ */
/* Component                                                             */
/* ------------------------------------------------------------------ */

export function QuickActionIntelligenceMenu({
  activeMatterId,
}: QuickActionIntelligenceMenuProps) {
  const router = useRouter();

  return (
    <div
      style={{
        background: "#111",
        minHeight: "100%",
        padding: "0 0 32px",
        fontFamily: "monospace",
      }}
    >
      {/* Matter context strip */}
      <div
        style={{
          borderBottom: "1px solid rgba(197,160,89,0.15)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: activeMatterId ? "#C5A059" : "#4b5563",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: activeMatterId ? "#C5A059" : "#6b7280",
          }}
        >
          {activeMatterId
            ? `Matter Context Active: ${activeMatterId}`
            : "No Matter Selected"}
        </span>
      </div>

      {/* Groups */}
      <div style={{ padding: "16px 16px 0" }}>
        {GROUPS.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div
              key={group.id}
              style={{ marginBottom: 20 }}
            >
              {/* Group header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  paddingBottom: 6,
                  borderBottom: "1px solid rgba(197,160,89,0.2)",
                }}
              >
                <GroupIcon
                  style={{ width: 12, height: 12, color: "#C5A059", flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "rgba(197,160,89,0.7)",
                  }}
                >
                  {group.label}
                </span>
              </div>

              {/* Action grid: 2-col desktop, 1-col mobile via flex-wrap */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 6,
                }}
              >
                {group.actions.map((action) => {
                  const { status, tooltip } = resolveStatus(action, activeMatterId);
                  const pill = STATUS_PILL[status];
                  const isDisabled = status === "DISABLED" || status === "BLOCKED";
                  const route = resolveRoute(action, activeMatterId);

                  return (
                    <button
                      key={action.label}
                      disabled={isDisabled}
                      title={tooltip || undefined}
                      onClick={() => {
                        if (!isDisabled) router.push(route);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        padding: "9px 12px",
                        background: isDisabled
                          ? "rgba(255,255,255,0.015)"
                          : "rgba(255,255,255,0.03)",
                        border: `1px solid ${
                          isDisabled
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(197,160,89,0.12)"
                        }`,
                        borderRadius: 6,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        textAlign: "left",
                        transition: "background 0.15s, border-color 0.15s",
                        opacity: isDisabled ? 0.55 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.background = "rgba(197,160,89,0.07)";
                          e.currentTarget.style.borderColor = "rgba(197,160,89,0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                          e.currentTarget.style.borderColor = "rgba(197,160,89,0.12)";
                        }
                      }}
                    >
                      {/* Left: label */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 10,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: isDisabled ? "#4b5563" : "rgba(255,255,255,0.8)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {action.label}
                        </span>
                      </div>

                      {/* Right: status pill + arrow */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 8,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: pill.color,
                            background: pill.bg,
                            padding: "2px 6px",
                            borderRadius: 3,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tooltip || pill.label}
                        </span>
                        <ChevronRight
                          style={{
                            width: 12,
                            height: 12,
                            color: isDisabled ? "#374151" : "rgba(197,160,89,0.5)",
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "0 20px",
          marginTop: 8,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 8,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(197,160,89,0.2)",
          }}
        >
          The Milano Seal™ · Quick Action Intelligence
        </span>
      </div>
    </div>
  );
}
