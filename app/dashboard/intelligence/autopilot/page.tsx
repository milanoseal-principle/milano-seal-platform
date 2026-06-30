import { requireDashboardAccess } from "@/lib/dashboardAuth";
import AutopilotPanel from "@/components/dashboard/AutopilotPanel";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";

export default async function AutopilotPage() {
  await requireDashboardAccess();
  return (
    <div className="space-y-6">
      <Reveal>
        <DashboardPageHeader
          eyebrow="Operator-Supervised Automation"
          title="Autopilot Control"
          description="Operator-confirmed task automation across active matters — notification orchestration, follow-up triggers, and event automation. Every action stays operator-reviewed; nothing auto-executes without confirmation."
          primaryAction={{ label: "Review Automation Queue", href: "/dashboard/follow-ups" }}
        />
      </Reveal>
      <Reveal delay={0.06}>
        <AutopilotPanel />
      </Reveal>
    </div>
  );
}
