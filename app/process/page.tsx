import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ProcessExperience } from "@/components/process/ProcessExperience";

export const metadata: Metadata = {
  title: "How It Works | The Milano Seal™",
  description: "The Milano Seal execution process.",
};

export default function ProcessPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[#C6A55A] text-sm font-medium tracking-wider uppercase mb-4 block">
            Execution Path
          </span>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            How It Works
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Six structured stages from matter intake through international delivery. Every step designed for compliance, precision, and complete client visibility.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Submit Your Matter</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Stage 01 callout */}
      <section className="pb-0 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-5 p-6 bg-[#111111] border border-[#C6A55A]/20 rounded-xl">
            <span className="font-serif text-3xl font-medium text-[#C6A55A]/40 flex-shrink-0 leading-none mt-1">01</span>
            <div>
              <h3 className="font-medium text-white mb-1">Submit Your Matter</h3>
              <p className="text-[#B0B0B0] text-sm leading-relaxed mb-3">
                Every engagement begins at the smart matter intake gate. Provide document details, destination requirements, and your timeline.
              </p>
              <Link href="/intake" className="inline-flex items-center gap-2 text-sm text-[#C6A55A] hover:underline">
                Go to Intake <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stages 02–06 */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {stages.map((stage) => (
            <div
              key={stage.id}
              id={stage.id}
              className={`p-8 border rounded-xl scroll-mt-24${stage.highlight ? " border-[#C6A55A]/25 bg-[#0D0B08]" : " border-[#2A2A2A] bg-[#111111]"}`}
            >
              <div className="flex items-start gap-5">
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <span className="font-serif text-3xl font-medium text-[#C6A55A]/30 leading-none">
                    {stage.number}
                  </span>
                  <div className={`p-2 rounded-lg ${stage.highlight ? "bg-[#C6A55A]/10 border border-[#C6A55A]/30" : "bg-[#1A1A1A] border border-[#2A2A2A]"}`}>
                    <stage.icon className="w-4 h-4 text-[#C6A55A]" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-xl md:text-2xl font-medium text-white mb-1">
                    {stage.title}
                  </h2>
                  <p className="text-[#C6A55A]/80 text-sm font-medium mb-4">{stage.headline}</p>
                  <p className="text-[#B0B0B0] text-sm leading-relaxed mb-5">{stage.body}</p>
                  <ul className="space-y-2">
                    {stage.details.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-sm text-[#8A8A8A]">
                        <span className="text-[#C6A55A]/40 mt-0.5">—</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Ready to Begin?
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit your matter and we will confirm scope, timeline, and pricing before anything is scheduled.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Submit Your Matter</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <p className="mt-8 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
            The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. Document execution coordination only. The Milano Seal™ does not provide legal guidance. Legal questions should be handled by a licensed attorney.</p>
        </div>
      </section>

      <main>
        <ProcessExperience />
      </main>
      <Footer />
    </>
  );
}
