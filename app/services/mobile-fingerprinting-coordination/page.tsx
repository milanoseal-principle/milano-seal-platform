import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "Mobile Fingerprinting Coordination | The Milano Seal™",
  description:
    "By-appointment mobile fingerprinting coordination and partner provider referral across Florida service areas.",
  alternates: {
    canonical:
      "https://www.themilanoseal.com/services/mobile-fingerprinting-coordination",
  },
};

export default function MobileFingerprintingCoordinationPage() {
  return (
    <ServicePageLayout
      h1="Mobile Fingerprinting Coordination"
      intro="For matters that call for on-site capture, we coordinate mobile appointments and partner provider referrals by appointment — reviewed by an operator before scheduling is confirmed."
      sections={[
        {
          title: "Coordination options",
          items: [
            "Florida Mobile Coordination by appointment",
            "Partner Provider Referral for field-based capture",
            "Remote intake and mail-in / upload document routes",
          ],
        },
        {
          title: "How it works",
          items: [
            "Secure intake request first",
            "Operator review of instructions and coverage",
            "Scheduling confirmed only after payment confirmation",
          ],
        },
      ]}
      disclaimers={[
        "Mobile and group requests require operator review. Scheduling is by appointment only.",
      ]}
    />
  );
}
