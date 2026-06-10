import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Oldsmar Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Oldsmar, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/oldsmar/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Oldsmar"
      regionLabel="Pinellas County"
      slug="oldsmar"
      canonicalPath="/oldsmar/apostille-services"
      headline="Oldsmar Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Oldsmar, FL clients."
      nearbyAreas={["Safety Harbor", "Clearwater", "Palm Harbor", "Tampa"]}
      metaTitle="Oldsmar Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Oldsmar, FL clients. Remote Online Notarization available."
    />
  );
}
