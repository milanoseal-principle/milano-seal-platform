import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { governanceAccess } from '@/lib/control-plane/governance/access';
import Link from 'next/link';
import { SystemControlPlaneModes } from "@/components/control-plane/SystemControlPlaneModes";
import { InternationalExecutionControlPanel } from "@/components/control-plane/InternationalExecutionControlPanel";
import { assertSystemRegistryIntegrity } from "@/lib/control-plane/placementGate";
import { validateArchitectureGovernance } from "@/lib/control-plane/architectureGovernance";

export const metadata = {
  title: "System Control Plane — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default async function SystemControlPlanePage() {
  const actor=await requireDashboardAccess();
  const registry = assertSystemRegistryIntegrity();
  const architecture = validateArchitectureGovernance();

  if (!registry.valid) {
    throw new Error(`System Registry integrity failure: ${registry.errors.join("; ")}`);
  }
  if (!architecture.valid) {
    throw new Error(`Architecture governance failure: ${architecture.errors.join("; ")}`);
  }

  return (
    <>
      {governanceAccess(actor.role)&&<div className="px-6 pt-6"><Link href="/dashboard/control-plane/board-room" className="inline-flex min-h-11 items-center rounded-lg border border-[#C6A55A]/40 px-5 py-3 text-sm text-[#D9BC74]">Corporate Board Room · governed AI roles and approvals</Link></div>}
      <SystemControlPlaneModes
        runtimeSha={process.env.VERCEL_GIT_COMMIT_SHA ?? "Runtime SHA unavailable"}
        environment={process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown"}
      />
      <div className="pb-16">
        <InternationalExecutionControlPanel />
      </div>
    </>
  );
}
