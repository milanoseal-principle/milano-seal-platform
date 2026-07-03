import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "Service Coverage & Locations | The Milano Seal™",
  description:
    "How The Milano Seal serves clients — Florida mobile coordination, partner provider referral, remote intake, and mail-in / upload document routes, by appointment only.",
  alternates: {
    canonical: "https://www.themilanoseal.com/locations",
  },
};

export default function LocationsPage() {
  return (
    <ServicePageLayout
      h1="Service Coverage & Locations"
      intro="We coordinate document matters through a combination of mobile, partner, and remote routes rather than a walk-in office. Coverage is arranged by appointment and reviewed before scheduling."
      sections={[
        {
          title: "How we serve clients",
          items: [
            "Florida Mobile Coordination",
            "Partner Provider Referral",
            "Remote Intake",
            "Mail-In / Upload Document Route",
            "By Appointment Only",
          ],
        },
        {
          title: "What to expect",
          items: [
            "Secure intake request first, coverage confirmed after review",
            "Mobile and group requests require operator review",
            "Scheduling confirmed only after payment confirmation",
          ],
        },
      ]}
      disclaimers={[
        "Coverage is arranged by appointment. Availability varies by matter and service area.",
      ]}
    />
  );
}
