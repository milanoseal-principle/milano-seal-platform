import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SERVICE_LANES } from "@/lib/intake/serviceIntent";

// "What do you need help with?" — the simple front door. Every lane converges on
// the one canonical Smart Intake (or the counsel lane). Links only: a lane is
// context for the questions asked, never a route, price, payment or schedule.
export function ServiceRouter() {
  return (
    <section id="what-do-you-need" aria-labelledby="service-router-heading" className="border-b border-[#C6A65B]/20 bg-[#0B0B0A] px-4 py-14 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[.2em] text-[#C6A65B]">Start here</p>
        <h2 id="service-router-heading" className="mt-3 font-serif text-3xl sm:text-4xl">What do you need help with?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Choose the closest match. We only ask what your Matter needs, and Milano review confirms the right execution path and your private quote.</p>
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_LANES.map((lane) => (
            <li key={lane.intent} className="min-w-0">
              <Link
                href={lane.href}
                data-intent={lane.intent}
                className="group flex h-full min-h-[8.5rem] flex-col justify-between rounded-sm border border-[#C6A65B]/22 bg-white/[0.02] p-5 transition hover:border-[#C6A65B]/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A65B]"
              >
                <span>
                  <span className="block text-[11px] uppercase tracking-[.16em] text-[#C6A65B]/85">{lane.title}</span>
                  <span className="mt-2 block text-base leading-6 text-white/85">“{lane.customerPhrase}”</span>
                </span>
                <span className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[.14em] text-[#E1C78F]">
                  {lane.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs leading-6 text-white/55">
          Prefer to talk first? <Link href="/pricing#get-pricing" className="text-[#E1C78F] underline-offset-4 hover:underline">Get pricing</Link> or <Link href="/speak-with-nicholas" className="text-[#E1C78F] underline-offset-4 hover:underline">speak with Nicholas</Link>. The Milano Seal coordinates U.S. document execution and is not a law firm.
        </p>
      </div>
    </section>
  );
}
