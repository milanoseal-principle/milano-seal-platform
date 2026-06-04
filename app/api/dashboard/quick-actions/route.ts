import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Fields that must never be returned
const BLOCKED_FIELDS = [
  "label_url",
  "margin",
  "base_cost",
  "operator_notes",
  "wise_payload",
  "raw_event",
  "full_signing_url",
  "bn_signing_url",
  "base64Doc",
  "storage_path",
  "file_path",
  "file_url",
  "SHIPPO_API_KEY",
  "BLUENOTARY_API_KEY",
  "SUPABASE_SERVICE_ROLE",
];

const ADMIN_ROLES = new Set(["admin", "operator", "superadmin"]);

const GROUPS = [
  {
    id: "matter",
    label: "Matter",
    actions: [
      "Matter Registry",
      "Create Matter",
      "Review Active Matter",
      "Intake Review",
      "Matter Pipeline",
    ],
  },
  {
    id: "financial",
    label: "Financial",
    actions: [
      "Payment Gate",
      "Invoice Studio",
      "Wise Reconciliation",
      "Open Balances",
      "Confirmed Payments",
    ],
  },
  {
    id: "execution",
    label: "Execution",
    actions: [
      "Schedule Execution",
      "Execution Checklist",
      "Signing Room",
      "Apostille Queue",
      "Release Desk",
    ],
  },
  {
    id: "courier",
    label: "Courier Custody",
    actions: [
      "Custody Rail",
      "Validate Address",
      "Preview Rates",
      "Purchase Label",
      "Delivered Not Released",
    ],
  },
  {
    id: "documents",
    label: "Documents",
    actions: [
      "The Vault",
      "Upload Documents",
      "Review Documents",
      "Certificate Library",
      "Release Certificate",
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    actions: [
      "Global Document Intelligence",
      "Atlas",
      "Compliance Matrix",
      "Authority Graph",
      "Receiving Authority Review",
      "Execution DNA",
      "Institutional Memory",
      "Truth Engine",
    ],
  },
  {
    id: "alliance",
    label: "Alliance / Revenue",
    actions: [
      "Alliance Desk",
      "Referral Ledger",
      "Partner Registry",
      "Revenue Desk",
      "Relationship Graph",
    ],
  },
  {
    id: "operations",
    label: "Operations",
    actions: [
      "Operations Desk",
      "VA Task Queue",
      "Operational Ledger",
      "Launch Control",
      "Control Room",
      "Admin Validator",
    ],
  },
];

export async function GET() {
  try {
    // Auth check: verify dashboard-level session
    const serverClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await serverClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify role
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !ADMIN_ROLES.has(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Count deals by status — graceful on missing table
    const { data: statusRows, error: dealsError } = await supabase
      .from("deals")
      .select("deal_status, release_status", { count: "exact" });

    if (dealsError) {
      return NextResponse.json({
        summary: {
          actionRequiredCount: 0,
          blockedCount: 0,
          reviewRequiredCount: 0,
          readyCount: 0,
          deliveredNotReleasedCount: 0,
          vaTaskCount: 0,
          overdueVaTaskCount: 0,
          no_data: true,
        },
        groups: GROUPS,
      });
    }

    const rows = statusRows ?? [];

    let actionRequiredCount = 0;
    let blockedCount = 0;
    let reviewRequiredCount = 0;
    let readyCount = 0;
    let deliveredNotReleasedCount = 0;

    for (const row of rows) {
      const s: string = row.deal_status ?? "";
      if (
        s === "awaiting_payment" ||
        s === "payment_failed" ||
        s === "intake_review"
      ) {
        actionRequiredCount++;
      } else if (s === "on_hold" || s === "blocked" || s === "cancelled") {
        blockedCount++;
      } else if (
        s === "reviewing" ||
        s === "compliance_review" ||
        s === "trust_review"
      ) {
        reviewRequiredCount++;
      } else if (
        s === "open" ||
        s === "scheduled" ||
        s === "in_execution" ||
        s === "apostille" ||
        s === "shipped" ||
        s === "completed"
      ) {
        readyCount++;
      }

      // Delivered not released: delivered status where release_status is not 'released'
      if (s === "delivered" && row.release_status !== "released") {
        deliveredNotReleasedCount++;
      }
    }

    // VA task counts — graceful on missing table
    let vaTaskCount = 0;
    let overdueVaTaskCount = 0;

    const { data: vaTasks } = await supabase
      .from("va_tasks")
      .select("status, due_date");

    if (vaTasks) {
      const now = new Date();
      for (const task of vaTasks) {
        if (task.status === "pending" || task.status === "assigned") {
          vaTaskCount++;
        }
        if (
          task.due_date &&
          new Date(task.due_date) < now &&
          task.status !== "complete" &&
          task.status !== "cancelled"
        ) {
          overdueVaTaskCount++;
        }
      }
    }

    const payload = {
      summary: {
        actionRequiredCount,
        blockedCount,
        reviewRequiredCount,
        readyCount,
        deliveredNotReleasedCount,
        vaTaskCount,
        overdueVaTaskCount,
        no_data: false,
      },
      groups: GROUPS,
    };

    // Ensure none of the blocked field names appear in serialized output
    const serialized = JSON.stringify(payload);
    for (const field of BLOCKED_FIELDS) {
      if (serialized.includes(`"${field}"`)) {
        return NextResponse.json(
          { error: "Payload validation failed" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[quick-actions] unexpected error", err);
    return NextResponse.json({
      summary: {
        actionRequiredCount: 0,
        blockedCount: 0,
        reviewRequiredCount: 0,
        readyCount: 0,
        deliveredNotReleasedCount: 0,
        vaTaskCount: 0,
        overdueVaTaskCount: 0,
        no_data: true,
      },
      groups: GROUPS,
    });
  }
}
