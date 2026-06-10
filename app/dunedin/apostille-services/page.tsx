import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Dunedin Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Dunedin, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/dunedin/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Dunedin"
      regionLabel="Pinellas County"
      slug="dunedin"
      canonicalPath="/dunedin/apostille-services"
      headline="Dunedin Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Dunedin, FL clients."
      nearbyAreas={["Clearwater", "Palm Harbor", "Safety Harbor", "Tarpon Springs"]}
      metaTitle="Dunedin Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Dunedin, FL clients. Remote Online Notarization available."
    />
  );
}
