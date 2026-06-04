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

type ActionStatus =
  | "READY"
  | "BLOCKED"
  | "REVIEW_REQUIRED"
  | "WARNING"
  | "COMPLETE"
  | "NO_DATA"
  | "DISABLED";

interface BadgeDef {
  label: string;
  count?: number;
  tone: "gold" | "amber" | "red" | "green" | "slate";
}

interface ActionDef {
  id: string;
  label: string;
  description: string;
  route: string;
  requiresMatter?: boolean;
  requiresPayment?: boolean;
  notMounted?: boolean;
  priority: "P0" | "P1" | "P2" | "P3";
  matterScoped: boolean;
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
      {
        id: "matter_registry",
        label: "Matter Registry",
        description: "Browse all matters",
        route: "/dashboard/deals",
        priority: "P1",
        matterScoped: false,
      },
      {
        id: "create_matter",
        label: "Create Matter",
        description: "Open intake form",
        route: "/intake",
        priority: "P1",
        matterScoped: false,
      },
      {
        id: "review_active_matter",
        label: "Review Active Matter",
        description: "Open active matter detail",
        route: "/dashboard/deals/[id]",
        requiresMatter: true,
        priority: "P0",
        matterScoped: true,
      },
      {
        id: "intake_review",
        label: "Intake Review",
        description: "Review matter intake",
        route: "/dashboard/review",
        requiresMatter: true,
        priority: "P0",
        matterScoped: true,
      },
      {
        id: "matter_pipeline",
        label: "Matter Pipeline",
        description: "Full pipeline view",
        route: "/dashboard/pipeline",
        priority: "P2",
        matterScoped: false,
      },
    ],
  },
  {
    id: "financial",
    label: "Financial",
    icon: DollarSign,
    actions: [
      {
        id: "payment_gate",
        label: "Payment Gate",
        description: "Verify payment clearance",
        route: "/dashboard/payments",
        requiresMatter: true,
        priority: "P0",
        matterScoped: true,
      },
      {
        id: "invoice_studio",
        label: "Invoice Studio",
        description: "Generate or review invoices",
        route: "/dashboard/invoices",
        requiresMatter: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "wise_reconciliation",
        label: "Wise Reconciliation",
        description: "Reconcile Wise transfers",
        route: "/dashboard/admin/reconciliation",
        priority: "P1",
        matterScoped: false,
      },
      {
        id: "open_balances",
        label: "Open Balances",
        description: "Matters awaiting payment",
        route: "/dashboard/payments?filter=awaiting_payment",
        priority: "P0",
        matterScoped: false,
      },
      {
        id: "confirmed_payments",
        label: "Confirmed Payments",
        description: "Cleared payment records",
        route: "/dashboard/payments?filter=paid",
        priority: "P2",
        matterScoped: false,
      },
    ],
  },
  {
    id: "execution",
    label: "Execution",
    icon: Zap,
    actions: [
      {
        id: "schedule_execution",
        label: "Schedule Execution",
        description: "Book execution appointment",
        route: "/dashboard/scheduling",
        requiresMatter: true,
        requiresPayment: true,
        priority: "P0",
        matterScoped: true,
      },
      {
        id: "execution_checklist",
        label: "Execution Checklist",
        description: "Pre-execution checklist",
        route: "/dashboard/deals/[id]?tab=execution",
        requiresMatter: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "signing_room",
        label: "Signing Room",
        description: "Remote online notarization",
        route: "/dashboard/ron",
        requiresMatter: true,
        notMounted: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "apostille_queue",
        label: "Apostille Queue",
        description: "Track apostille processing",
        route: "/dashboard/apostille",
        requiresMatter: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "release_desk",
        label: "Release Desk",
        description: "Authorize document release",
        route: "/dashboard/releases",
        requiresMatter: true,
        priority: "P0",
        matterScoped: true,
      },
    ],
  },
  {
    id: "courier",
    label: "Courier Custody",
    icon: Package,
    actions: [
      {
        id: "custody_rail",
        label: "Custody Rail",
        description: "Shipping custody tracker",
        route: "/dashboard/shipping?matter_id=[id]",
        requiresMatter: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "validate_address",
        label: "Validate Address",
        description: "Validate recipient address",
        route: "/dashboard/shipping?matter_id=[id]&action=validate_address",
        requiresMatter: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "preview_rates",
        label: "Preview Rates",
        description: "Estimate shipping cost",
        route: "/dashboard/shipping?matter_id=[id]&action=preview_rates",
        requiresMatter: true,
        priority: "P2",
        matterScoped: true,
      },
      {
        id: "purchase_label",
        label: "Purchase Label",
        description: "Buy shipping label",
        route: "/dashboard/shipping?matter_id=[id]&action=purchase_label",
        requiresMatter: true,
        requiresPayment: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "delivered_not_released",
        label: "Delivered Not Released",
        description: "Flagged courier holds",
        route: "/dashboard/releases?filter=delivered_not_released",
        priority: "P0",
        matterScoped: false,
      },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    icon: FolderOpen,
    actions: [
      {
        id: "the_vault",
        label: "The Vault",
        description: "Secure document repository",
        route: "/dashboard/documents",
        requiresMatter: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "upload_documents",
        label: "Upload Documents",
        description: "Add documents to matter",
        route: "/dashboard/documents/upload",
        requiresMatter: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "review_documents",
        label: "Review Documents",
        description: "Review pending documents",
        route: "/dashboard/documents/review",
        requiresMatter: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "certificate_library",
        label: "Certificate Library",
        description: "Browse certificates",
        route: "/dashboard/certificates",
        requiresMatter: true,
        priority: "P2",
        matterScoped: true,
      },
      {
        id: "release_certificate",
        label: "Release Certificate",
        description: "Issue release certificate",
        route: "/dashboard/releases/certificates",
        requiresMatter: true,
        priority: "P0",
        matterScoped: true,
      },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: Globe,
    actions: [
      {
        id: "global_doc_intelligence",
        label: "Global Document Intelligence",
        description: "Compliance intelligence layer",
        route: "/dashboard/compliance",
        requiresMatter: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "atlas",
        label: "Atlas",
        description: "Global execution map",
        route: "/map",
        priority: "P2",
        matterScoped: false,
      },
      {
        id: "compliance_matrix",
        label: "Compliance Matrix",
        description: "Per-matter compliance view",
        route: "/dashboard/compliance-matrix",
        requiresMatter: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "authority_graph",
        label: "Authority Graph",
        description: "Receiving authority relationships",
        route: "/dashboard/authority-graph",
        notMounted: true,
        priority: "P2",
        matterScoped: false,
      },
      {
        id: "receiving_authority",
        label: "Receiving Authority Review",
        description: "Review receiving authority",
        route: "/dashboard/authorities",
        requiresMatter: true,
        priority: "P1",
        matterScoped: true,
      },
      {
        id: "execution_dna",
        label: "Execution DNA",
        description: "Matter execution fingerprint",
        route: "/dashboard/dna",
        requiresMatter: true,
        notMounted: true,
        priority: "P3",
        matterScoped: true,
      },
      {
        id: "institutional_memory",
        label: "Institutional Memory",
        description: "Organizational knowledge base",
        route: "/dashboard/memory",
        notMounted: true,
        priority: "P2",
        matterScoped: false,
      },
      {
        id: "truth_engine",
        label: "Truth Engine",
        description: "Document verification engine",
        route: "/dashboard/truth",
        notMounted: true,
        priority: "P2",
        matterScoped: false,
      },
    ],
  },
  {
    id: "alliance",
    label: "Alliance / Revenue",
    icon: Users,
    actions: [
      {
        id: "alliance_desk",
        label: "Alliance Desk",
        description: "Partner alliance overview",
        route: "/alliance/dashboard",
        priority: "P1",
        matterScoped: false,
      },
      {
        id: "referral_ledger",
        label: "Referral Ledger",
        description: "Track referral activity",
        route: "/dashboard/referrals",
        notMounted: true,
        priority: "P2",
        matterScoped: false,
      },
      {
        id: "partner_registry",
        label: "Partner Registry",
        description: "Manage partner records",
        route: "/dashboard/partners",
        notMounted: true,
        priority: "P2",
        matterScoped: false,
      },
      {
        id: "revenue_desk",
        label: "Revenue Desk",
        description: "Revenue analytics",
        route: "/dashboard/revenue",
        notMounted: true,
        priority: "P2",
        matterScoped: false,
      },
      {
        id: "relationship_graph",
        label: "Relationship Graph",
        description: "Partner relationship map",
        route: "/dashboard/relationships",
        notMounted: true,
        priority: "P3",
        matterScoped: false,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Settings,
    actions: [
      {
        id: "operations_desk",
        label: "Operations Desk",
        description: "VA operations overview",
        route: "/va/dashboard",
        priority: "P1",
        matterScoped: false,
      },
      {
        id: "va_task_queue",
        label: "VA Task Queue",
        description: "Pending VA tasks",
        route: "/dashboard/va",
        notMounted: true,
        priority: "P1",
        matterScoped: false,
      },
      {
        id: "operational_ledger",
        label: "Operational Ledger",
        description: "System event ledger",
        route: "/dashboard/terminal",
        priority: "P2",
        matterScoped: false,
      },
      {
        id: "launch_control",
        label: "Launch Control",
        description: "Go-live readiness check",
        route: "/dashboard/go-live",
        notMounted: true,
        priority: "P1",
        matterScoped: false,
      },
      {
        id: "control_room",
        label: "Control Room",
        description: "Admin configuration",
        route: "/dashboard/admin",
        priority: "P2",
        matterScoped: false,
      },
      {
        id: "admin_validator",
        label: "Admin Validator",
        description: "System integrity check",
        route: "/dashboard/admin/validate",
        notMounted: true,
        priority: "P1",
        matterScoped: false,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Status pill styles                                                    */
/* ------------------------------------------------------------------ */

const STATUS_PILL: Record<ActionStatus, { bg: string; color: string; label: string }> = {
  READY: { bg: "rgba(197,160,89,0.12)", color: "#C5A059", label: "READY" },
  BLOCKED: { bg: "rgba(100,116,139,0.18)", color: "#94a3b8", label: "BLOCKED" },
  REVIEW_REQUIRED: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "REVIEW" },
  DISABLED: { bg: "rgba(80,80,80,0.15)", color: "#6b7280", label: "DISABLED" },
  WARNING: { bg: "rgba(245,158,11,0.08)", color: "#fbbf24", label: "WARNING" },
  COMPLETE: { bg: "rgba(63,164,122,0.12)", color: "#3FA47A", label: "COMPLETE" },
  NO_DATA: { bg: "rgba(100,116,139,0.10)", color: "#64748b", label: "NO DATA" },
};

/* ------------------------------------------------------------------ */
/* Badge tone styles                                                     */
/* ------------------------------------------------------------------ */

const BADGE_TONE: Record<BadgeDef["tone"], { bg: string; color: string; border: string }> = {
  gold: { bg: "rgba(197,160,89,0.14)", color: "#C5A059", border: "rgba(197,160,89,0.3)" },
  amber: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  red: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.3)" },
  green: { bg: "rgba(63,164,122,0.12)", color: "#3FA47A", border: "rgba(63,164,122,0.3)" },
  slate: { bg: "rgba(100,116,139,0.12)", color: "#64748b", border: "rgba(100,116,139,0.2)" },
};

/* ------------------------------------------------------------------ */
/* Props                                                                 */
/* ------------------------------------------------------------------ */

export interface QuickActionIntelligenceMenuProps {
  activeMatterId?: string;
  deliveredNotReleasedCount?: number;
  vaTaskCount?: number;
  actionRequiredCount?: number;
  blockedCount?: number;
  reviewRequiredCount?: number;
  readyCount?: number;
}

/* ------------------------------------------------------------------ */
/* Route resolution                                                      */
/* ------------------------------------------------------------------ */

function resolveRoute(action: ActionDef, matterId?: string): string {
  let base = action.route;

  // Routes that embed [id] directly (e.g. /dashboard/shipping?matter_id=[id]...)
  if (base.includes("[id]")) {
    if (matterId) {
      return base.replace(/\[id\]/g, matterId);
    }
    // No matterId: strip entire query string and [id] path segment
    return base.replace(/\?.*$/, "").replace("/[id]", "");
  }

  // Routes that already have a query string
  if (base.includes("?")) {
    return matterId && action.requiresMatter ? `${base}&matter_id=${matterId}` : base;
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
  matterId?: string,
  deliveredNotReleasedCount?: number
): { status: ActionStatus; tooltip: string; badge?: BadgeDef } {
  if (action.notMounted) {
    return { status: "DISABLED", tooltip: "Future Module" };
  }
  if (action.requiresMatter && !matterId) {
    return { status: "DISABLED", tooltip: "Select a matter first" };
  }

  // Delivered Not Released badge logic
  if (
    action.id === "delivered_not_released" &&
    deliveredNotReleasedCount &&
    deliveredNotReleasedCount > 0
  ) {
    return {
      status: "REVIEW_REQUIRED",
      tooltip: "",
      badge: {
        label: String(deliveredNotReleasedCount),
        count: deliveredNotReleasedCount,
        tone: "amber",
      },
    };
  }

  return { status: "READY", tooltip: "" };
}

/* ------------------------------------------------------------------ */
/* Badge chip component                                                  */
/* ------------------------------------------------------------------ */

function BadgeChip({ badge }: { badge: BadgeDef }) {
  const t = BADGE_TONE[badge.tone];
  return (
    <span
      style={{
        fontSize: 8,
        letterSpacing: "0.12em",
        color: t.color,
        background: t.bg,
        border: `1px solid ${t.border}`,
        padding: "1px 5px",
        borderRadius: 3,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {badge.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Summary bar                                                           */
/* ------------------------------------------------------------------ */

function SummaryBar({
  actionRequiredCount = 0,
  blockedCount = 0,
  reviewRequiredCount = 0,
  readyCount = 0,
}: Pick<
  QuickActionIntelligenceMenuProps,
  "actionRequiredCount" | "blockedCount" | "reviewRequiredCount" | "readyCount"
>) {
  const total = actionRequiredCount + blockedCount + reviewRequiredCount + readyCount;
  if (total === 0) return null;

  const chips: { label: string; count: number; tone: BadgeDef["tone"] }[] = [
    { label: "Action Required", count: actionRequiredCount, tone: "red" },
    { label: "Blocked", count: blockedCount, tone: "slate" },
    { label: "Review Required", count: reviewRequiredCount, tone: "amber" },
    { label: "Ready", count: readyCount, tone: "green" },
  ].filter((c) => c.count > 0);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: "10px 20px",
        borderBottom: "1px solid rgba(197,160,89,0.1)",
      }}
    >
      {chips.map((chip) => {
        const t = BADGE_TONE[chip.tone];
        return (
          <span
            key={chip.label}
            style={{
              fontSize: 8,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: t.color,
              background: t.bg,
              border: `1px solid ${t.border}`,
              padding: "3px 7px",
              borderRadius: 3,
              whiteSpace: "nowrap",
            }}
          >
            {chip.label} {chip.count}
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                             */
/* ------------------------------------------------------------------ */

export function QuickActionIntelligenceMenu({
  activeMatterId,
  deliveredNotReleasedCount = 0,
  vaTaskCount: _vaTaskCount = 0,
  actionRequiredCount = 0,
  blockedCount = 0,
  reviewRequiredCount = 0,
  readyCount = 0,
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
      {/* CSS animations */}
      <style>{`
        @keyframes qa-amber-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); border-color: rgba(245,158,11,0.25); }
          50% { box-shadow: 0 0 0 3px rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.5); }
        }
        @keyframes qa-gold-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .qa-pulse { animation: none !important; }
        }
      `}</style>

      {/* Header eyebrow */}
      <div
        style={{
          padding: "12px 20px 8px",
          borderBottom: "1px solid rgba(197,160,89,0.1)",
        }}
      >
        <p
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(197,160,89,0.55)",
            margin: 0,
          }}
        >
          / OPERATOR QUICK ACTIONS /
        </p>
        <p
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
            margin: "4px 0 0",
            letterSpacing: "0.04em",
          }}
        >
          Matter-aware shortcuts for payment, execution, custody, intelligence, and release control.
        </p>
      </div>

      {/* Matter context strip */}
      <div
        style={{
          borderBottom: "1px solid rgba(197,160,89,0.15)",
          padding: "10px 20px",
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

      {/* Summary bar */}
      <SummaryBar
        actionRequiredCount={actionRequiredCount}
        blockedCount={blockedCount}
        reviewRequiredCount={reviewRequiredCount}
        readyCount={readyCount}
      />

      {/* Groups */}
      <div style={{ padding: "16px 16px 0" }}>
        {GROUPS.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.id} style={{ marginBottom: 20 }}>
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

              {/* Action grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 6,
                }}
              >
                {group.actions.map((action) => {
                  const { status, tooltip, badge } = resolveStatus(
                    action,
                    activeMatterId,
                    deliveredNotReleasedCount
                  );
                  const pill = STATUS_PILL[status];
                  const isDisabled = status === "DISABLED" || status === "BLOCKED";
                  const isReviewRequired = status === "REVIEW_REQUIRED";
                  const route = resolveRoute(action, activeMatterId);

                  return (
                    <button
                      key={action.id}
                      disabled={isDisabled}
                      title={tooltip || undefined}
                      className={isReviewRequired ? "qa-pulse" : undefined}
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
                            : isReviewRequired
                              ? "rgba(245,158,11,0.25)"
                              : "rgba(197,160,89,0.12)"
                        }`,
                        borderRadius: 6,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        textAlign: "left",
                        transition: "background 0.15s, border-color 0.15s",
                        opacity: isDisabled ? 0.55 : 1,
                        animation: isReviewRequired
                          ? "qa-amber-pulse 1800ms ease-in-out infinite"
                          : undefined,
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
                          e.currentTarget.style.borderColor = isReviewRequired
                            ? "rgba(245,158,11,0.25)"
                            : "rgba(197,160,89,0.12)";
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
                        {action.notMounted && (
                          <span
                            style={{
                              fontSize: 7,
                              letterSpacing: "0.1em",
                              color: "#4b5563",
                              border: "1px solid rgba(75,85,99,0.4)",
                              padding: "1px 4px",
                              borderRadius: 2,
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            FUTURE
                          </span>
                        )}
                      </div>

                      {/* Right: status pill + optional badge chip + chevron */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        {badge && <BadgeChip badge={badge} />}
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
                          {tooltip ? tooltip : pill.label}
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
