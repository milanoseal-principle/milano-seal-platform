import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Lakewood Ranch Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Lakewood Ranch, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/lakewood-ranch/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Lakewood Ranch"
      regionLabel="Manatee County"
      slug="lakewood-ranch"
      canonicalPath="/lakewood-ranch/apostille-services"
      headline="Lakewood Ranch Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Lakewood Ranch, FL clients."
      nearbyAreas={["Sarasota", "Bradenton", "Venice", "North Port"]}
      metaTitle="Lakewood Ranch Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Lakewood Ranch, FL clients. Remote Online Notarization available."
    />
  );
}
