import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Clearwater Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Clearwater, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/clearwater/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Clearwater"
      regionLabel="Pinellas County"
      slug="clearwater"
      canonicalPath="/clearwater/apostille-services"
      headline="Clearwater Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Clearwater, FL clients."
      nearbyAreas={["Dunedin", "Safety Harbor", "Largo", "Palm Harbor", "Oldsmar"]}
      metaTitle="Clearwater Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Clearwater, FL clients. Remote Online Notarization available."
    />
  );
}
