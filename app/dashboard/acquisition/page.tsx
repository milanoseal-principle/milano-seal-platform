export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { AcquisitionCommandCenter } from "@/components/acquisition/AcquisitionCommandCenter";

export const metadata: Metadata = {
  title: "Acquisition — Milano Seal",
  description:
    "Client acquisition command center: funnel tracking, lead scoring, dynamic CTAs, referral classification, abandoned-intake recovery, and founder review.",
};

export default async function AcquisitionPage() {
  await requireDashboardAccess();

  // No fabricated metrics: real data sources are wired in as the acquisition
  // pipeline is instrumented. Until then panels render honest zero/empty states.
  return (
    <div className="ms-fade-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <DashboardPageHeader
          eyebrow="Client Acquisition Engine"
          title="Acquisition"
          description="Funnel tracking, lead scoring, dynamic CTAs, referral classification, and abandoned-intake recovery. All figures start from honest zero states until live data is connected."
          primaryAction={{ label: "Open Secure Intake", href: "/intake" }}
        />

        <AcquisitionCommandCenter
          funnel={[
            { stage: "visitor", count: 0 },
            { stage: "intake_started", count: 0 },
            { stage: "intake_completed", count: 0 },
            { stage: "quoted", count: 0 },
            { stage: "payment_confirmed", count: 0 },
          ]}
        />
      </div>
    </div>
  );
}
