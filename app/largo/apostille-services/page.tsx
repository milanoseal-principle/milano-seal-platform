import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Largo Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Largo, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/largo/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Largo"
      regionLabel="Pinellas County"
      slug="largo"
      canonicalPath="/largo/apostille-services"
      headline="Largo Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Largo, FL clients."
      nearbyAreas={["Clearwater", "St. Petersburg", "Pinellas Park", "Seminole"]}
      metaTitle="Largo Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Largo, FL clients. Remote Online Notarization available."
    />
  );
}
