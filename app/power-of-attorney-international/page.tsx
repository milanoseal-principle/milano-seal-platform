import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "International Power of Attorney with Apostille | The Milano Seal™",
  description:
    "Execute a power of attorney for international use — apostille-authenticated for Italy, Spain, Mexico, Brazil, and globally. Florida notary. Priority execution available.",
  alternates: {
    canonical: "https://themilanoseal.com/power-of-attorney-international",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "International Power of Attorney with Apostille",
  provider: {
    "@type": "ProfessionalService",
    name: "The Milano Seal™",
    url: "https://themilanoseal.com",
  },
  serviceType: "Notarization and Apostille",
  areaServed: { "@type": "Country", name: "Worldwide" },
  description:
    "Execution of powers of attorney for international use with Hague apostille or consular authentication.",
};

const countries = [
  {
    flag: "🇮🇹",
    name: "Italy",
    note: "Hague member — apostille required. Commonly used for Italian citizenship proceedings, property, and succession.",
  },
  {
    flag: "🇪🇸",
    name: "Spain",
    note: "Hague member — apostille required. Real estate purchases and estate administration.",
  },
  {
    flag: "🇲🇽",
    name: "Mexico",
    note: "Non-Hague — consular legalization chain required. Property and business matters.",
  },
  {
    flag: "🇧🇷",
    name: "Brazil",
    note: "Hague member — apostille required. Business, property, and estate proceedings.",
  },
  {
    flag: "🇩🇪",
    name: "Germany",
    note: "Hague member — apostille required. Estate and financial matters.",
  },
  {
    flag: "🇬🇷",
    name: "Greece",
    note: "Hague member — apostille required. Property, citizenship, and succession.",
  },
];

export default function PowerOfAttorneyInternationalPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Header />
      <main className="bg-[#0A0A0A] min-h-screen">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-32 pb-16">
          <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-semibold mb-4">
            International Authority Documents
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-white leading-tight mb-6">
            International Power
            <br />
            of Attorney
          </h1>
          <p className="text-[#8A8A8A] text-lg leading-relaxed font-light max-w-2xl">
            A power of attorney for international use must meet the
            authentication requirements of both the executing jurisdiction and
            the receiving country. The Milano Seal™ handles the complete
            execution and apostille chain — from notarization through Florida
            Department of State authentication and international delivery.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              href="/intake"
              className="px-8 py-3.5 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold tracking-[0.15em] uppercase rounded-sm hover:bg-[#D4BB7A] transition-colors"
            >
              Begin Your Matter
            </Link>
            <Link
              href="/map"
              className="px-8 py-3.5 border border-[#2A2A2A] text-[#C6A55A] text-xs font-semibold tracking-[0.15em] uppercase rounded-sm hover:border-[#C6A55A] transition-colors"
            >
              Global Document Intelligence
            </Link>
          </div>
        </section>

        {/* What makes international POA different */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white mb-5">
            What Makes an International POA Different
          </h2>
          <div className="text-[#8A8A8A] text-base leading-relaxed space-y-4 font-light">
            <p>
              A power of attorney executed in the United States for domestic use
              requires only a Florida-commissioned notary. A power of attorney
              intended for foreign use carries additional requirements: the
              document must typically be authenticated via the Hague Apostille
              Convention (for member countries) or through a consular
              legalization chain (for non-member countries).
            </p>
            <p>
              The specific requirements vary by destination country, by the
              nature of the power being granted (general, specific, real estate,
              healthcare, etc.), and in some cases by the specific municipality
              or court that will receive it. The Milano Seal™ assesses each
              matter individually to ensure the correct execution path is
              followed.
            </p>
          </div>
        </section>

        {/* Countries */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white mb-6">
            Countries We Serve
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {countries.map((c) => (
              <div
                key={c.name}
                className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{c.flag}</span>
                  <p className="text-white font-medium text-sm">{c.name}</p>
                </div>
                <p className="text-[#8A8A8A] text-sm font-light leading-relaxed">
                  {c.note}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[#8A8A8A] text-sm font-light mt-4">
            Don't see your country?{" "}
            <Link href="/map" className="text-[#C6A55A] hover:underline">
              Check the compliance map
            </Link>{" "}
            or{" "}
            <Link href="/intake" className="text-[#C6A55A] hover:underline">
              submit your matter
            </Link>{" "}
            — we handle 100+ destinations.
          </p>
        </section>

        {/* Types */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white mb-5">
            Types of International Power of Attorney
          </h2>
          <div className="space-y-3">
            {[
              {
                title: "General Power of Attorney",
                desc: "Broad authority granted to an agent to act on the principal's behalf across multiple categories of action.",
              },
              {
                title: "Special / Limited Power of Attorney",
                desc: "Authority limited to a specific transaction, property, or action — most common for international real estate closings.",
              },
              {
                title: "Real Estate Power of Attorney",
                desc: "Authorizes the agent to purchase, sell, manage, or encumber real property in the destination country.",
              },
              {
                title: "Financial Power of Attorney",
                desc: "Grants authority over banking, investment, and financial accounts in the foreign jurisdiction.",
              },
              {
                title: "Estate & Succession POA",
                desc: "Used in foreign probate and succession proceedings where the U.S.-based heir cannot appear in person.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-5"
              >
                <p className="text-white font-medium text-sm mb-1">
                  {item.title}
                </p>
                <p className="text-[#8A8A8A] text-sm font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-xl text-white mb-4">
            Related Services
          </h2>
          <div className="space-y-3">
            {[
              {
                href: "/international-affidavit",
                label: "International Affidavit Execution & Apostille",
              },
              {
                href: "/affidavit-name-discrepancy",
                label: "Affidavit of Name Discrepancy",
              },
              { href: "/apostille/italy", label: "Apostille for Italy" },
              { href: "/apostille/spain", label: "Apostille for Spain" },
              { href: "/apostille/mexico", label: "Apostille for Mexico" },
              {
                href: "/map",
                label: "Global Document Intelligence — All Countries",
              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between px-5 py-3.5 bg-[#111111] border border-[#1A1A1A] rounded-lg hover:border-[#C6A55A]/30 transition-colors group"
              >
                <span className="text-[#B0B0B0] text-sm group-hover:text-white transition-colors">
                  {link.label}
                </span>
                <span className="text-[#C6A55A] text-xs">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-[#1A1A1A] text-center">
          <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-semibold mb-3">
            Begin Your Matter
          </p>
          <h2 className="font-serif text-3xl text-white mb-4">
            Ready to Execute Your International POA?
          </h2>
          <p className="text-[#8A8A8A] text-base font-light mb-8 max-w-xl mx-auto">
            Submit your matter. Nicholas Milano reviews every international POA
            personally before execution is scheduled.
          </p>
          <Link
            href="/intake"
            className="inline-block px-10 py-4 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold tracking-[0.2em] uppercase rounded-sm hover:bg-[#D4BB7A] transition-colors"
          >
            Submit Your Matter
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
