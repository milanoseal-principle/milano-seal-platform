"use client";

<<<<<<< HEAD
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
=======
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FilePlus2, FileText, CreditCard, RefreshCw, DollarSign,
  Calendar, CheckSquare, Video, Star, Package,
  Archive, Upload, BookOpen, Award, Unlock,
  Globe, Map, ShieldCheck, Network, Users, Search,
  Brain, Database, Layers, ClipboardList, Radio,
  BarChart2, UserCheck, Briefcase, Settings, Activity, X, Shield,
  MapPin,
} from "lucide-react";

interface ActionItem {
  label: string;
  icon: React.ElementType;
  route: string;
  badge?: "action" | "blocked" | "review" | "ready" | "warning";
  badgeCount?: number;
}

interface Group {
  id: string;
  label: string;
  actions: ActionItem[];
}

interface Summary {
  actionRequiredCount: number;
  blockedCount: number;
  reviewRequiredCount: number;
  readyCount: number;
  deliveredNotReleasedCount: number;
  vaTaskCount: number;
  overdueVaTaskCount: number;
  no_data: boolean;
}

const ROUTE_MAP: Record<string, { icon: React.ElementType; route: string }> = {
  "Matter Registry":           { icon: Archive,      route: "/dashboard/deals" },
  "Create Matter":             { icon: FilePlus2,    route: "/dashboard/intake" },
  "Review Active Matter":      { icon: Search,       route: "/dashboard/pipeline" },
  "Intake Review":             { icon: ClipboardList,route: "/dashboard/intake" },
  "Matter Pipeline":           { icon: Layers,       route: "/dashboard/pipeline" },
  "Payment Gate":              { icon: CreditCard,   route: "/dashboard/admin/payments" },
  "Invoice Studio":            { icon: FileText,     route: "/dashboard/invoices" },
  "Wise Reconciliation":       { icon: RefreshCw,    route: "/dashboard/admin/reconciliation" },
  "Open Balances":             { icon: DollarSign,   route: "/dashboard/admin/payments" },
  "Confirmed Payments":        { icon: CheckSquare,  route: "/dashboard/admin/payments" },
  "Schedule Execution":        { icon: Calendar,     route: "/dashboard/compliance" },
  "Execution Checklist":       { icon: CheckSquare,  route: "/dashboard/compliance" },
  "Signing Room":              { icon: Video,        route: "/dashboard/compliance" },
  "Apostille Queue":           { icon: Star,         route: "/dashboard/apostille" },
  "Release Desk":              { icon: Unlock,       route: "/dashboard/releases" },
  "Custody Rail":              { icon: Package,      route: "/dashboard/courier" },
  "Validate Address":          { icon: MapPin,       route: "/dashboard/courier" },
  "Preview Rates":             { icon: BarChart2,    route: "/dashboard/courier" },
  "Purchase Label":            { icon: Package,      route: "/dashboard/courier" },
  "Delivered Not Released":    { icon: Activity,     route: "/dashboard/releases" },
  "The Vault":                 { icon: Archive,      route: "/dashboard/docs" },
  "Upload Documents":          { icon: Upload,       route: "/dashboard/docs" },
  "Review Documents":          { icon: FileText,     route: "/dashboard/docs" },
  "Certificate Library":       { icon: Award,        route: "/dashboard/docs" },
  "Release Certificate":       { icon: Unlock,       route: "/dashboard/releases" },
  "Global Document Intelligence": { icon: Globe,     route: "/dashboard/intelligence/compliance" },
  "Atlas":                     { icon: Map,          route: "/dashboard/atlas" },
  "Compliance Matrix":         { icon: ShieldCheck,  route: "/dashboard/compliance" },
  "Authority Graph":           { icon: Network,      route: "/dashboard/authorities" },
  "Receiving Authority Review":{ icon: UserCheck,    route: "/dashboard/authorities" },
  "Execution DNA":             { icon: Brain,        route: "/dashboard/intelligence/autopilot" },
  "Institutional Memory":      { icon: Database,     route: "/dashboard/memory" },
  "Truth Engine":              { icon: Radio,        route: "/dashboard/truth" },
  "Alliance Desk":             { icon: Briefcase,    route: "/dashboard/alliance" },
  "Referral Ledger":           { icon: BookOpen,     route: "/dashboard/referral" },
  "Partner Registry":          { icon: Users,        route: "/dashboard/alliance" },
  "Revenue Desk":              { icon: DollarSign,   route: "/dashboard/revenue" },
  "Relationship Graph":        { icon: Network,      route: "/dashboard/relationships" },
  "Operations Desk":           { icon: Settings,     route: "/dashboard/admin" },
  "VA Task Queue":             { icon: ClipboardList,route: "/dashboard/va" },
  "Operational Ledger":        { icon: BookOpen,     route: "/dashboard/terminal" },
  "Launch Control":            { icon: Radio,        route: "/dashboard/admin" },
  "Control Room":              { icon: Activity,     route: "/dashboard/admin" },
  "Admin Validator":           { icon: ShieldCheck,  route: "/dashboard/admin" },
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function QuickActionIntelligenceMenu({
  isOpen,
  onClose,
  matterId,
}: {
  isOpen: boolean;
  onClose: () => void;
  matterId?: string;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/dashboard/quick-actions")
      .then(r => r.json())
      .then(data => {
        setSummary(data.summary ?? null);
        setGroups(
          (data.groups ?? []).map((g: { id: string; label: string; actions: string[] }) => ({
            ...g,
            actions: g.actions.map((label: string) => {
              const meta = ROUTE_MAP[label] ?? { icon: Activity, route: "/dashboard" };
              return { label, ...meta };
            }),
          }))
        );
      })
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [isOpen]);

  function buildRoute(action: ActionItem): string {
    if (matterId) return `${action.route}?matter_id=${matterId}`;
    return action.route;
  }

  const badgeColor = (b?: string) => {
    if (b === "action") return "#ef4444";
    if (b === "blocked") return "#f59e0b";
    if (b === "review") return "#D4AF37";
    if (b === "ready") return "#22c55e";
    if (b === "warning") return "#f97316";
    return "transparent";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.42, ease: EASE }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
            style={{ background: "rgba(6,4,2,0.98)", borderLeft: "1px solid rgba(212,175,55,0.14)", boxShadow: "-20px 0 60px rgba(0,0,0,0.7)" }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-5 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.04) 60%, transparent 100%)", borderBottom: "1px solid rgba(212,175,55,0.12)" }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)" }} />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center rounded flex-shrink-0"
                  style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.22)" }}>
                  <Shield className="w-4 h-4" style={{ color: "#D4AF37" }} />
                </div>
                <div>
                  <p className="font-mono text-[8.5px] tracking-[0.32em] uppercase" style={{ color: "rgba(212,175,55,0.55)" }}>
                    {matterId ? `Matter · ${matterId.slice(0, 8).toUpperCase()}` : "Internal Management Layer"}
                  </p>
                  <h2 className="font-serif text-base text-white tracking-wide leading-tight mt-0.5">Quick Actions</h2>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary bar */}
            {summary && !summary.no_data && (
              <div className="flex gap-2 px-4 py-2 flex-shrink-0 flex-wrap" style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
                {summary.actionRequiredCount > 0 && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                    {summary.actionRequiredCount} ACTION
                  </span>
                )}
                {summary.blockedCount > 0 && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                    {summary.blockedCount} BLOCKED
                  </span>
                )}
                {summary.reviewRequiredCount > 0 && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.3)" }}>
                    {summary.reviewRequiredCount} REVIEW
                  </span>
                )}
                {summary.deliveredNotReleasedCount > 0 && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}>
                    {summary.deliveredNotReleasedCount} NOT RELEASED
                  </span>
                )}
                {summary.overdueVaTaskCount > 0 && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {summary.overdueVaTaskCount} VA OVERDUE
                  </span>
                )}
              </div>
            )}

            {/* Action list */}
            <div className="flex-1 overflow-y-auto px-4 pb-5 pt-3" style={{ scrollbarWidth: "none" }}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.4)" }}>Loading…</span>
                </div>
              ) : (
                groups.map(({ id, label, actions }) => (
                  <div key={id} className="mb-4">
                    <span className="font-mono text-[7.5px] tracking-[0.3em] uppercase px-1 pb-1 block" style={{ color: "rgba(212,175,55,0.3)" }}>{label}</span>
                    <div className="space-y-1">
                      {actions.map((action, i) => {
                        const Icon = action.icon;
                        return (
                          <motion.button
                            key={action.label}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.025, ease: EASE, duration: 0.28 }}
                            onClick={() => { router.push(buildRoute(action)); onClose(); }}
                            whileHover={{ y: -1 }}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded text-left"
                            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,175,55,0.1)" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.06)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.1)"; }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0"
                                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                                <Icon className="w-3.5 h-3.5" style={{ color: "#D4AF37" }} />
                              </span>
                              <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.78)" }}>
                                {action.label}
                              </span>
                            </div>
                            <span className="font-mono text-[8px] flex-shrink-0" style={{ color: matterId ? "rgba(198,165,90,0.7)" : "rgba(212,175,55,0.45)" }}>
                              {matterId ? "→ MATTER" : "→"}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(212,175,55,0.08)" }}>
              <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-center" style={{ color: "rgba(212,175,55,0.25)" }}>
                The Milano Seal™ · Operator Layer
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
>>>>>>> claude/funny-maxwell-hlxQN
  );
}
