import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Sarasota Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Sarasota, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/sarasota/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Sarasota"
      regionLabel="Sarasota County"
      slug="sarasota"
      canonicalPath="/sarasota/apostille-services"
      headline="Sarasota Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Sarasota, FL clients."
      nearbyAreas={["Bradenton", "Venice", "Lakewood Ranch", "North Port"]}
      metaTitle="Sarasota Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Sarasota, FL clients. Remote Online Notarization available."
    />
  );
}
