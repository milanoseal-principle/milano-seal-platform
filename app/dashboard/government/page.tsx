export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { GovernmentCommandCenter } from "@/components/dashboard/government/GovernmentCommandCenter";
import { GovernmentCRMBoard } from "@/components/dashboard/government/GovernmentCRMBoard";
import { ProcurementOpportunityBoard } from "@/components/dashboard/government/ProcurementOpportunityBoard";
import { VendorRegistrationTracker } from "@/components/dashboard/government/VendorRegistrationTracker";
import { CommodityCodeRegistry } from "@/components/dashboard/government/CommodityCodeRegistry";
import { CapabilityStatementManager } from "@/components/dashboard/government/CapabilityStatementManager";
import { BidNoBidScoringPanel } from "@/components/dashboard/government/BidNoBidScoringPanel";
import { GovernmentRevenuePanel } from "@/components/dashboard/government/GovernmentRevenuePanel";
import { GovernmentSafetyPanel } from "@/components/dashboard/government/GovernmentSafetyPanel";
import { RecordedSubmissionsPanel } from "@/components/dashboard/government/RecordedSubmissionsPanel";
import type {
  GovernmentCrmRecord,
  ProcurementOpportunity,
} from "@/lib/government/types";
import type { VendorRegistration } from "@/lib/government/vendorRegistrationTracker";
import { GOVERNMENT_SUBMISSIONS } from "@/lib/government/submissions/pinellasItq250786";

export const metadata = {
  title: "Government — The Milano Seal™",
  robots: { index: false },
};

// Internal sample data — clearly labeled, illustrative only. Not real clients,
// awards, or registrations.
const SAMPLE_CRM: GovernmentCrmRecord[] = [
  {
    agency: "Sample County Government",
    department: "Procurement",
    buyer: "—",
    procurement_officer: "—",
    contract_manager: "—",
    solicitation_number: "SAMPLE-001",
    opportunity_value: 24000,
    status: "opportunity_identified",
    award_date: null,
    renewal_date: null,
    incumbent_vendor: null,
    competitors: [],
    relationship_score: 35,
    vendor_registration_status: "in_progress",
    capability_statement_sent: true,
    next_follow_up: "2026-08-01",
  },
];

const SAMPLE_OPPS: ProcurementOpportunity[] = [
  {
    type: "rfp",
    title: "Sample RFP — Notarization & Document Execution",
    agency: "Sample City Government",
    deadline: "2026-08-15",
    value: 40000,
    stage: "opportunity_identified",
  },
];

const SAMPLE_REGISTRATIONS: VendorRegistration[] = [
  {
    portal: "Sample OpenGov Vendor Portal",
    agency: "Sample County Government",
    status: "in_progress",
    vendorId: null,
    submittedDate: null,
    expirationDate: null,
    notes: "Illustrative record — not an active registration.",
  },
];

export default async function GovernmentDashboardPage() {
  await requireDashboardAccess();

  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader
        eyebrow="Government & Public Sector Vertical"
        title="Government"
        description="Public-sector CRM, procurement tracking, vendor registration, capability statement, and bid/no-bid scoring for government document-execution engagements."
      />

      <p className="rounded-xl border border-amber-300/20 bg-black/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-amber-200/70">
        Payment Gate Status: ENFORCED · Recorded Submissions are real; all other
        panels show internal sample data
      </p>

      <RecordedSubmissionsPanel submissions={GOVERNMENT_SUBMISSIONS} />

      <GovernmentCommandCenter
        records={SAMPLE_CRM}
        opportunities={SAMPLE_OPPS}
        registeredAgencies={0}
        submittedBids={0}
        governmentRevenue={0}
        governmentClients={0}
      />
      <GovernmentCRMBoard records={SAMPLE_CRM} />
      <ProcurementOpportunityBoard opportunities={SAMPLE_OPPS} />
      <VendorRegistrationTracker registrations={SAMPLE_REGISTRATIONS} />
      <CommodityCodeRegistry />
      <CapabilityStatementManager />
      <BidNoBidScoringPanel />
      <GovernmentRevenuePanel />
      <GovernmentSafetyPanel />
    </div>
  );
}
