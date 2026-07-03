import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "FBI Background Check Apostille Coordination | The Milano Seal™",
  description:
    "Coordination for FBI Identity History Summary authentication routing through federal channels for international document use.",
  alternates: {
    canonical: "https://www.themilanoseal.com/services/fbi-background-check-apostille",
  },
};

export default function FbiBackgroundCheckApostillePage() {
  return (
    <ServicePageLayout
      h1="FBI Background Check Apostille Coordination"
      intro="Once an FBI Identity History Summary has been obtained, we coordinate its federal authentication routing so it can be presented to a receiving authority abroad."
      sections={[
        {
          title: "What we review",
          items: [
            "The format and issuing details of the Identity History Summary",
            "Federal authentication routing through the U.S. Department of State",
            "Destination requirements (operator-reviewed, not absolute)",
            "Return delivery and final packet requirements",
          ],
        },
        {
          title: "Good to know",
          items: [
            "Federal documents route to federal authentication, not state apostille",
            "We do not obtain clearances or predict outcomes",
            "Coordination begins after secure intake and review",
          ],
        },
      ]}
      disclaimers={[
        "An FBI Identity History Summary is a personal record request and is not a substitute for an employment or licensing background check.",
      ]}
    />
  );
}
