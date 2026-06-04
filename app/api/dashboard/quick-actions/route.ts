import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Fields that must never be returned
const BLOCKED_FIELDS = [
  "label_url",
  "margin",
  "base_cost",
  "operator_notes",
  "wise_payload",
];

const GROUPS = [
  {
    id: "matter",
    label: "Matter",
    actions: [
      "Open Matter Registry",
      "Create Matter",
      "Review Active Matter",
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
    actions: ["The Vault", "Upload Documents", "Certificate Library"],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    actions: [
      "Global Document Intelligence",
      "Atlas",
      "Authority Graph",
      "Truth Engine",
      "Institutional Memory",
    ],
  },
  {
    id: "alliance",
    label: "Alliance / Revenue",
    actions: ["Alliance Desk", "Referral Ledger", "Revenue Desk"],
  },
  {
    id: "operations",
    label: "Operations",
    actions: ["Operations Desk", "Operational Ledger", "Control Room"],
  },
];

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Count deals by status — graceful on missing table
    const { data: statusRows, error } = await supabase
      .from("deals")
      .select("deal_status", { count: "exact" });

    if (error) {
      // Table missing or unreachable — return graceful no_data
      return NextResponse.json({
        summary: {
          actionRequiredCount: 0,
          blockedCount: 0,
          reviewRequiredCount: 0,
          readyCount: 0,
          no_data: true,
        },
        groups: GROUPS,
      });
    }

    const rows = statusRows ?? [];

    // Tally counts by broad bucket
    let actionRequiredCount = 0;
    let blockedCount = 0;
    let reviewRequiredCount = 0;
    let readyCount = 0;

    for (const row of rows) {
      const s: string = row.deal_status ?? "";
      if (
        s === "awaiting_payment" ||
        s === "payment_failed" ||
        s === "intake_review"
      ) {
        actionRequiredCount++;
      } else if (
        s === "on_hold" ||
        s === "blocked" ||
        s === "cancelled"
      ) {
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
    }

    // Verify no blocked fields leaked (belt-and-suspenders)
    const payload = {
      summary: {
        actionRequiredCount,
        blockedCount,
        reviewRequiredCount,
        readyCount,
        no_data: false,
      },
      groups: GROUPS,
    };

    // Ensure none of the blocked field names appear in serialized output
    const serialized = JSON.stringify(payload);
    for (const field of BLOCKED_FIELDS) {
      if (serialized.includes(`"${field}"`)) {
        // Shouldn't happen with this payload shape, but be safe
        return NextResponse.json({ error: "Payload validation failed" }, { status: 500 });
      }
    }

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[quick-actions] unexpected error", err);
    return NextResponse.json(
      {
        summary: {
          actionRequiredCount: 0,
          blockedCount: 0,
          reviewRequiredCount: 0,
          readyCount: 0,
          no_data: true,
        },
        groups: GROUPS,
      }
    );
  }
}
