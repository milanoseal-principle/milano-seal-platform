export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadCustomerTrust } from "@/lib/trust/customer-trust";
import { TrustEngine } from "./TrustEngine";

export const metadata = {
  title: "Trust Engine — Milano Seal",
  robots: { index: false },
};

export default async function TrustPage() {
  await requireDashboardAccess();
  const snapshot = await loadCustomerTrust();
  return <TrustEngine snapshot={snapshot} />;
}
