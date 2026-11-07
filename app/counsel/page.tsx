import { COUNSEL_USE_CASES } from "@/lib/counsel/content";
import {
  CounselDiscovery,
  CounselFAQ,
} from "@/components/counsel/CounselContent";
import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/PublicShell";
import { CounselExperience } from "@/components/counsel/CounselExperience";
import { COUNTRIES } from "@/data/intelligence/countries";
import "./counsel.css";

const title =
  "U.S. Document Execution for International Counsel | The Milano Seal™";
const description =
  "A governed U.S. execution point for international counsel coordinating client documents for use abroad.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://www.themilanoseal.com/counsel" },
  openGraph: {
    title,
    description,
    url: "https://www.themilanoseal.com/counsel",
    type: "website",
    images: [
      {
        url: "https://www.themilanoseal.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Milano Seal — your U.S. execution desk",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://www.themilanoseal.com/og-image.png"],
  },
};
export default function CounselPage() {
  const countries = COUNTRIES.map(({ name, id }) => ({ name, slug: id })).sort(
    (a, b) => a.name.localeCompare(b.name),
  );
  return (
    <PublicShell>
      <main className="counsel-page">
        <CounselExperience
          countries={countries}
          useCases={COUNSEL_USE_CASES.map(({ slug, title }) => ({
            slug,
            title,
          }))}
        />
        <CounselDiscovery />
        <CounselFAQ />
      </main>
    </PublicShell>
  );
}
