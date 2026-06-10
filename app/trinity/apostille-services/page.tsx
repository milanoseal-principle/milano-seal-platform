import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Trinity Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Trinity, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/trinity/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Trinity"
      regionLabel="Pasco County"
      slug="trinity"
      canonicalPath="/trinity/apostille-services"
      headline="Trinity Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Trinity, FL clients."
      nearbyAreas={["New Port Richey", "Odessa", "Land O' Lakes", "Wesley Chapel"]}
      metaTitle="Trinity Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Trinity, FL clients. Remote Online Notarization available."
    />
  );
}
