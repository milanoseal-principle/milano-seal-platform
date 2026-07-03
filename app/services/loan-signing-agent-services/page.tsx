import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "Loan Signing Agent Services | The Milano Seal™",
  description:
    "Coordination support for loan signing document packages by appointment, with careful review of package completeness.",
  alternates: {
    canonical: "https://www.themilanoseal.com/services/loan-signing-agent-services",
  },
};

export default function LoanSigningAgentServicesPage() {
  return (
    <ServicePageLayout
      h1="Loan Signing Agent Services"
      intro="For loan signing packages, we coordinate a careful, by-appointment signing with attention to document completeness and return handling."
      sections={[
        {
          title: "What we review",
          items: [
            "The signing package and its instructions",
            "Signer identification requirements",
            "Return delivery and packet handling",
            "Scheduling windows and coordination",
          ],
        },
        {
          title: "How coordination works",
          items: [
            "Secure intake request first",
            "Operator review of the package",
            "Appointment confirmed after payment confirmation",
          ],
        },
      ]}
    />
  );
}
