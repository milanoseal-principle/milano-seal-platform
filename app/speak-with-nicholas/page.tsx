import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { NicholasContactForm } from "@/components/conversion/NicholasContactForm";
import { resolveConciergeContext } from "@/lib/acquisition/concierge-context";

export const metadata: Metadata = {
  title: "Speak With Nicholas | The Milano Seal™",
  description: "Request a conversation with The Milano Seal about your document execution matter.",
  robots: { index: false, follow: true },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SpeakWithNicholasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = resolveConciergeContext(await searchParams);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Header />
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-[calc(var(--header-total-height)+2rem)] sm:px-8">
        <section className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#C6A55A]">Private Matter Conversation</p>
            <h1 className="mt-4 max-w-xl font-serif text-4xl leading-tight text-white sm:text-5xl">Speak With Nicholas</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65">Have a question before sending documents? Share a little context and the Milano team will review your request.</p>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/45">Milano coordinates U.S. document execution. This inquiry does not provide legal advice, confirm eligibility, create a Matter, issue a quote, or reserve an appointment.</p>
          </div>
          <NicholasContactForm
            {...context}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}