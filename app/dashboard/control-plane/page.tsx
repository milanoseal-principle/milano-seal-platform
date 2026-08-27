import { SystemControlPlaneModes } from "@/components/control-plane/SystemControlPlaneModes";
import { assertSystemRegistryIntegrity } from "@/lib/control-plane/placementGate";
import { validateArchitectureGovernance } from "@/lib/control-plane/architectureGovernance";

export const metadata = {
  title: "System Control Plane — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default function SystemControlPlanePage() {
  const registry = assertSystemRegistryIntegrity();
  const architecture = validateArchitectureGovernance();

  if (!registry.valid) {
    throw new Error(`System Registry integrity failure: ${registry.errors.join("; ")}`);
  }
  if (!architecture.valid) {
    throw new Error(`Architecture governance failure: ${architecture.errors.join("; ")}`);
  }

  return (
    <SystemControlPlaneModes
      runtimeSha={process.env.VERCEL_GIT_COMMIT_SHA ?? "Runtime SHA unavailable"}
      environment={process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown"}
    />
  );
}
