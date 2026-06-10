import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Wesley Chapel Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Wesley Chapel, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/wesley-chapel/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Wesley Chapel"
      regionLabel="Pasco County"
      slug="wesley-chapel"
      canonicalPath="/wesley-chapel/apostille-services"
      headline="Wesley Chapel Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Wesley Chapel, FL clients."
      nearbyAreas={["Land O' Lakes", "Zephyrhills", "New Tampa", "Lutz"]}
      metaTitle="Wesley Chapel Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Wesley Chapel, FL clients. Remote Online Notarization available."
    />
  );
}
