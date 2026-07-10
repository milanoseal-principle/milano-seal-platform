export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { AllianceDispatchCommandCenter } from "@/components/dispatch/AllianceDispatchCommandCenter";
import { PartnerApplicationQueue } from "@/components/dispatch/PartnerApplicationQueue";
import { PartnerVerificationPanel } from "@/components/dispatch/PartnerVerificationPanel";
import { PartnerPassportPanel } from "@/components/dispatch/PartnerPassportPanel";
import { TrustScorePanel } from "@/components/dispatch/TrustScorePanel";
import { CoverageMapPanel } from "@/components/dispatch/CoverageMapPanel";
import { AvailabilityBoard } from "@/components/dispatch/AvailabilityBoard";
import { DispatchQueue } from "@/components/dispatch/DispatchQueue";
import { AssignmentWorkflow } from "@/components/dispatch/AssignmentWorkflow";
import { CompletionReviewPanel } from "@/components/dispatch/CompletionReviewPanel";
import { QAReviewPanel } from "@/components/dispatch/QAReviewPanel";
import { PartnerPaymentQueue } from "@/components/dispatch/PartnerPaymentQueue";
import { FounderApprovalPanel } from "@/components/dispatch/FounderApprovalPanel";

export const metadata = {
  title: "Alliance Dispatch — The Milano Seal™",
  robots: { index: false },
};

// Honest empty states — no fabricated partners, assignments, or payments.
export default async function AllianceDispatchPage() {
  await requireDashboardAccess();

  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader
        eyebrow="Alliance Dispatch Network"
        title="Alliance Dispatch"
        description="Independent-partner intake, verification, trust scoring, coverage, dispatch offers, completion QA, and a founder-gated partner payment tracking queue."
      />

      <p className="rounded-xl border border-amber-300/20 bg-black/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-amber-200/70">
        Independent partners — no guaranteed assignments or income · Partner
        payments require founder approval (no auto-pay)
      </p>

      <AllianceDispatchCommandCenter />
      <PartnerApplicationQueue />
      <PartnerVerificationPanel />
      <PartnerPassportPanel />
      <TrustScorePanel />
      <CoverageMapPanel />
      <AvailabilityBoard />
      <DispatchQueue />
      <AssignmentWorkflow />
      <CompletionReviewPanel />
      <QAReviewPanel />
      <PartnerPaymentQueue />
      <FounderApprovalPanel />
    </div>
  );
}
