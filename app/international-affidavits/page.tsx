import type { Metadata } from "next";
import Link from "next/link";
import { CommercialCtaRow } from "@/components/conversion/CommercialCtaRow";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "International Affidavit Library | The Milano Seal™",
  description:
    "Authority library for international affidavits, powers of attorney, name discrepancy statements, one-and-the-same affidavits, missing-record statements, and translation accuracy affidavits.",
  alternates: { canonical: "https://themilanoseal.com/international-affidavits" },
};

const pages = [
  {
    href: "/international-affidavit",
    title: "International Affidavit",
    description: "Sworn statements prepared for foreign, institutional, legal, or administrative use.",
  },
  {
    href: "/power-of-attorney-international",
    title: "International Power of Attorney",
    description: "U.S. execution support for powers of attorney intended for use abroad.",
  },
  {
    href: "/affidavit-name-discrepancy",
    title: "Affidavit of Name Discrepancy",
    description: "Explains spelling, formatting, maiden-name, or other record inconsistencies.",
  },
  {
    href: "/affidavit-one-and-the-same",
    title: "Affidavit of One and the Same Person",
    description: "Connects multiple records or historical name variants to the same individual.",
  },
  {
    href: "/affidavit-non-existence-record",
    title: "Affidavit of Non-Existence of Record",
    description: "Documents search efforts and the unavailability of a required record when requested by a receiving authority.",
  },
  {
    href: "/affidavit-translation-accuracy",
    title: "Affidavit of Translation Accuracy",
    description: "Sworn translator statement confirming that a translation accurately reflects the source document.",
  },
] as const;

export default function InternationalAffidavitLibraryPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0A0A0A]">
        <section className="mx-auto max-w-5xl px-6 pb-14 pt-[calc(var(--header-total-height)+var(--sa-top)+2rem)]">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C6A55A]">International Documents</p>
          <h1 className="mb-6 font-serif text-4xl leading-tight text-white md:text-5xl">International Affidavit Library</h1>
          <p className="max-w-3xl text-lg font-light leading-relaxed text-[#8A8A8A]">
            A structured authority index for sworn statements used in cross-border matters. Each page explains the document’s purpose, common uses, and the execution or authentication questions that should be confirmed before a Matter moves forward.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/intake" className="rounded-sm bg-[#C6A55A] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#0A0A0A] transition-colors hover:bg-[#D4BB7A]">Begin Secure Intake</Link>
            <Link href="/map" className="rounded-sm border border-[#C6A55A]/35 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#C6A55A] transition-colors hover:border-[#C6A55A]">Global Document Intelligence</Link>
          </div>
                  <CommercialCtaRow context={{ serviceIntent: "international_execution", source: "international-affidavits" }} actions={["get_pricing", "speak"]} className="mt-6" />
        </section>

        <section className="mx-auto max-w-5xl border-t border-[#1A1A1A] px-6 py-12">
          <div className="grid gap-4 md:grid-cols-2">
            {pages.map((page) => (
              <Link key={page.href} href={page.href} className="group rounded-2xl border border-[#1A1A1A] bg-[#111111] p-6 transition-colors hover:border-[#C6A55A]/35">
                <p className="mb-2 font-serif text-xl text-white">{page.title}</p>
                <p className="text-sm font-light leading-relaxed text-[#8A8A8A]">{page.description}</p>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C6A55A]">Open authority page →</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl border-t border-[#1A1A1A] px-6 py-12">
          <h2 className="mb-4 font-serif text-2xl text-white">How the Library Fits the Execution System</h2>
          <p className="max-w-3xl text-sm font-light leading-relaxed text-[#8A8A8A]">
            Document education is not a substitute for Matter review. The destination country, document origin, signer location, receiving authority, already-completed services, and current verified instructions determine the actual route. The Milano Seal uses these pages to explain document classes while the Smart Intake and operator workflow establish the Matter-specific execution path.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/countries" className="text-sm text-[#C6A55A] hover:text-[#D4BB7A]">Country authority pages →</Link>
            <Link href="/services/apostille" className="text-sm text-[#C6A55A] hover:text-[#D4BB7A]">Apostille coordination →</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
