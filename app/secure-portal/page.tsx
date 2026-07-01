import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Secure Matter Portal | The Milano Seal™",
  description:
    "Track your matter from intake to international release. Your secure portal provides visibility into matter status, payment status, execution lane, apostille stage, document review, courier activity, and final release confirmation.",
  alternates: { canonical: "https://themilanoseal.com/secure-portal" },
};

const PORTAL_VIEWS = [
  "Matter status",
  "Payment status",
  "Execution lane",
  "Pre-flight review",
  "Document vault",
  "Apostille stage",
  "Shipping and delivery updates",
  "Coordinator messages",
  "Final release confirmation",
] as const;

const STAGES = [
  "Intake Received",
  "Under Review",
  "Quoted / Awaiting Payment",
  "Scheduled",
  "In Execution",
  "Apostille Processing",
  "In Transit",
  "Delivered",
  "Completed",
  "Paid & Released",
] as const;

const VAULT_STATES = [
  "Not Uploaded",
  "Uploaded",
  "Under Review",
  "Approved",
  "Ready for Execution",
  "Ready for Release",
  "Released",
] as const;

export default function SecurePortalPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0A0A0A] overflow-x-hidden">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-32 pb-10">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]/70">
            Secure Matter Portal
          </p>
          <h1 className="font-serif text-3xl leading-tight text-white sm:text-5xl">
            Track your matter from intake to{" "}
            <span className="italic text-[#C6A55A]">international release</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#8A8A8A]">
            Your secure portal provides visibility into matter status, payment status, execution lane,
            apostille stage, document review, courier activity, and final release confirmation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?next=/portal"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#C6A55A]/40 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#C6A55A] transition-colors hover:border-[#C6A55A]"
            >
              Login
            </Link>
            <Link
              href="/intake"
              className="inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a1206]"
              style={{ background: "linear-gradient(180deg,#ECD79A,#C6A55A)" }}
            >
              Begin Secure Intake
            </Link>
          </div>
        </section>

        {/* Inside your portal */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white">Inside your portal, you can view</h2>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {PORTAL_VIEWS.map((v) => (
              <div
                key={v}
                className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#1A1A1A] bg-[#0E0E0E] p-4"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C6A55A]/70" />
                <span className="text-sm text-white/85">{v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Payment-Gated Execution trust block */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 border-t border-[#1A1A1A]">
          <div className="rounded-2xl border border-[#C6A55A]/20 bg-[#0E0E0E] p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-white">Payment-Gated Execution</h2>
            <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-[#B8B8B8]">
              No matter is scheduled, executed, apostilled, couriered, or released until scope is confirmed
              and the required payment status is complete. This protects document integrity, scheduling
              accuracy, and chain-of-custody control.
            </p>
          </div>
        </section>

        {/* Portal stage preview */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white">Matter journey</h2>
          <p className="mt-1.5 text-sm text-[#8A8A8A]">
            Preview only — your live matter status appears after secure access.
          </p>
          <ol className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {STAGES.map((s, i) => (
              <li
                key={s}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-[#1A1A1A] bg-[#0E0E0E] p-4"
              >
                <span className="shrink-0 font-mono text-[11px] text-[#C6A55A]/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm text-white/80">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Document vault preview */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white">Document vault</h2>
          <p className="mt-1.5 text-sm text-[#8A8A8A]">
            Preview only — your live matter status appears after secure access.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {VAULT_STATES.map((v) => (
              <span
                key={v}
                className="rounded-full border border-[#1A1A1A] bg-[#0E0E0E] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-white/70"
              >
                {v}
              </span>
            ))}
          </div>
          <p className="mt-6 text-[12.5px] leading-relaxed text-[#8A8A8A]">
            Tracking details will appear once release or courier activity is created.
          </p>
        </section>

        {/* CTA repeat */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 border-t border-[#1A1A1A]">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?next=/portal"
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg border border-[#C6A55A]/40 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#C6A55A] transition-colors hover:border-[#C6A55A]"
            >
              Login
            </Link>
            <Link
              href="/intake"
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a1206]"
              style={{ background: "linear-gradient(180deg,#ECD79A,#C6A55A)" }}
            >
              Begin Secure Intake
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12 border-t border-[#1A1A1A]">
          <p className="text-[11px] leading-relaxed text-[#8A8A8A]/80">
            Final acceptance remains subject to the receiving authority.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
