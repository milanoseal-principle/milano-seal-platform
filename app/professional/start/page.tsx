import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/PublicShell";

export const metadata: Metadata = {
  title: "Start a Client Matter | The Milano Seal™",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PublicShell>
      <main
        className="min-h-screen bg-[#060606] px-4 pb-20 text-white sm:px-6"
        style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top) + 3rem)" }}
      >
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A65B]/70">Start a client Matter</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl">Start a client Matter.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/45">You retain legal control. The Milano Seal handles the U.S. execution side. Matter-specific execution quote issued after review.</p>
          <div className="mt-10">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Registered professional", "Sign in to submit for your client or send a secure intake link. Matters stay linked to your profile.", "/login?next=/professional/matters/new", "Sign In"],
                ["New to The Milano Seal", "Create a professional profile. Account access follows review.", "/professional/profile", "Create Professional Profile"],
                ["Submit without a profile", "Open professional secure intake directly. The Matter is reviewed the same way.", "/intake?lane=professional&source=professional-start", "Open Secure Intake"],
              ].map(([title, body, href, cta]) => (
                <article key={title} className="flex flex-col rounded-2xl border border-white/[0.07] bg-[#09090A] p-6">
                  <h2 className="font-serif text-2xl text-white">{title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-white/45">{body}</p>
                  <Link href={href} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border border-[#C6A65B]/35 px-5 text-sm font-medium text-[#C6A65B] transition-colors hover:bg-[#C6A65B]/[0.06]">
                    {cta}
                  </Link>
                </article>
              ))}
            </div>
            <p className="mt-8 text-xs leading-5 text-white/30">
              Final acceptance is determined by the receiving authority. The Milano Seal is not a law firm and does not provide legal advice or legal representation.
            </p>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
