import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { DamianiReentry } from "./DamianiReentry";

// Personalized professional re-entry route. It is intentionally kept out of
// search indexes and sitemaps: it welcomes a single returning professional
// client by name and must never surface in public discovery. No private prior
// matter, email, firm, or discount-redemption information is rendered here.
export const metadata: Metadata = {
  title: "Bentornata, Avv. Damiani | The Milano Seal™",
  description:
    "Accesso professionale riservato per Avv. Damiani. Avvii una nuova pratica di esecuzione documentale negli Stati Uniti con The Milano Seal.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: "https://www.themilanoseal.com/professional/damiani" },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; courtesy?: string }>;
}) {
  const params = await searchParams;
  const initialLang = params.lang === "en" ? "en" : "it";

  // The query parameter is only a routing signal. It never authorizes or
  // redeems a discount; server-side eligibility must still verify the code and
  // professional identity before pricing changes.
  const courtesyRequested = params.courtesy?.trim().toUpperCase() === "DAMIANI50";

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <DamianiReentry
        initialLang={initialLang}
        courtesyRequested={courtesyRequested}
      />
      <Footer />
    </main>
  );
}
