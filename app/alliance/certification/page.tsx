import { requireAllianceAccess } from "@/lib/allianceAuth";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import { PartnerCertificationFlow } from "@/components/alliance/PartnerCertificationFlow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Partner Certification | The Milano Seal™",
  robots: { index: false, follow: false },
};

export default async function PartnerCertificationPage() {
  await requireAllianceAccess();

  return (
    <AllianceShell>
      <PartnerCertificationFlow />
    </AllianceShell>
  );
}
