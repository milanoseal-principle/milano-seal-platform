export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import MilanoSealMotionDemoNoMap from "@/components/dashboard/motion/MilanoSealMotionDemoNoMap";

export const metadata = {
  // Milano Seal Motion Preview — isolated cinematic motion system preview for
  // future controlled dashboard and portal surfaces. Demo values are illustrative
  // only and are not live telemetry.
  title: "Milano Seal Motion Preview — The Milano Seal™",
  robots: { index: false, follow: false },
};

// Isolated, auth-gated preview route. Renders the demo shell only; not wired into
// any live operator surface. Demo / illustrative values only.
export default async function MotionPreviewPage() {
  await requireDashboardAccess();
  return <MilanoSealMotionDemoNoMap />;
}
