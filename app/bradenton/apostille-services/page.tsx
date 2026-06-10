import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Bradenton Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Bradenton, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/bradenton/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Bradenton"
      regionLabel="Manatee County"
      slug="bradenton"
      canonicalPath="/bradenton/apostille-services"
      headline="Bradenton Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Bradenton, FL clients."
      nearbyAreas={["Sarasota", "Lakewood Ranch", "Palmetto", "Ellenton"]}
      metaTitle="Bradenton Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Bradenton, FL clients. Remote Online Notarization available."
    />
  );
}
