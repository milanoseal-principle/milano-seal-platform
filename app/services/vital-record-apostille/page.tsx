import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "Vital Record Apostille Coordination | The Milano Seal™",
  description:
    "Apostille coordination for state and county vital records — birth, marriage, and death records — through issuing-state rules.",
  alternates: {
    canonical: "https://www.themilanoseal.com/services/vital-record-apostille",
  },
};

export default function VitalRecordApostillePage() {
  return (
    <ServicePageLayout
      h1="Vital Record Apostille Coordination"
      intro="Vital records are authenticated through the state that issued them. We review the issuing jurisdiction and certification chain to route birth, marriage, and death records correctly."
      sections={[
        {
          title: "What we review",
          items: [
            "The issuing state or county of the record",
            "Whether a certified copy meets issuing-state requirements",
            "Whether county certification is needed before state apostille",
            "Destination review (operator-reviewed, not absolute)",
          ],
        },
        {
          title: "How coordination works",
          items: [
            "Secure intake and document review first",
            "Issuing-state routing coordination",
            "Return delivery and final packet assembly",
          ],
        },
      ]}
    />
  );
}
