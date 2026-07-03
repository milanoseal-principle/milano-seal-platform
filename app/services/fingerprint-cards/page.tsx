import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "Fingerprint Card Support | The Milano Seal™",
  description:
    "Support for hard-card and out-of-state fingerprint card preparation and routing, including FD-258 and applicant card handling.",
  alternates: {
    canonical: "https://www.themilanoseal.com/services/fingerprint-cards",
  },
};

export default function FingerprintCardsPage() {
  return (
    <ServicePageLayout
      h1="Fingerprint Card Support"
      intro="We support hard-card fingerprint preparation and routing — including FD-258 cards, applicant cards, and out-of-state card scans — for submissions that call for physical cards."
      sections={[
        {
          title: "What we review",
          items: [
            "Which card format the receiving authority requires",
            "Whether agency instructions or an ORI apply",
            "Whether a card scan or mail-in route is appropriate",
            "Return delivery and packet assembly",
          ],
        },
        {
          title: "How coordination works",
          items: [
            "Secure intake and document review first",
            "Operator confirmation of instructions before submission",
            "Mobile or partner capture arranged only after review",
          ],
        },
      ]}
    />
  );
}
