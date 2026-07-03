import Link from "next/link";
import type { ReactNode } from "react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export interface ServiceSection {
  title: string;
  items: string[];
}

export function ServicePageLayout({
  h1,
  intro,
  sections,
  disclaimers,
  children,
}: {
  h1: string;
  intro: string;
  sections: ServiceSection[];
  disclaimers?: string[];
  children?: ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-16 text-stone-200">
        <h1 className="text-3xl font-semibold text-amber-100 sm:text-4xl">{h1}</h1>
        <p className="mt-5 text-sm leading-7 text-stone-300 sm:text-base">{intro}</p>

        <div className="mt-10 space-y-6">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-amber-300/15 bg-black/50 p-6"
            >
              <h2 className="text-xl font-semibold text-amber-100">{section.title}</h2>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-stone-300">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden className="mt-1 text-amber-300">
                      &#9670;
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {children}

        <div className="mt-10 space-y-2 text-xs leading-6 text-stone-400">
          {(disclaimers ?? []).map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p>Final acceptance remains subject to the receiving authority.</p>
        </div>

        <div className="mt-10">
          <Link
            href="/intake"
            className="inline-flex items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10 px-8 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
          >
            Begin Secure Intake
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
