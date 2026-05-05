"use client";

import { useEffect, useState, Suspense } from "react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  CheckCircle,
  Clock,
  MessageCircle,
  Shield,
  ArrowRight,
  CreditCard,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-[#2A2A2A] text-[#8A8A8A] hover:text-[#C6A55A] hover:border-[#C6A55A]/30 transition-colors text-xs"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          Copy
        </>
      )}
    </button>
  );
}

interface WiseInvoice {
  payment_method: string;
  amount: number;
  reference: string;
  note: string;
  wise_link: string;
  wise_request_id?: string | null;
  wise_mode?: "test" | "production" | "fallback";
  status: string;
}

function ConfirmationInner() {
  const params = useSearchParams();
  const dealId = params.get("id") || "";
  const [intakeData, setIntakeData] = useState<any>(null);
  const [wiseInvoice, setWiseInvoice] = useState<WiseInvoice | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    try {
      const raw = sessionStorage.getItem("ms_intake_response");
      if (raw) setIntakeData(JSON.parse(raw));
      const wiseRaw = sessionStorage.getItem("ms_wise_invoice");
      if (wiseRaw) setWiseInvoice(JSON.parse(wiseRaw));
    } catch {}
  }, []);

  const displayId = dealId ? dealId.slice(0, 12).toUpperCase() : null;
  const lane = intakeData?.lane;
  const amount = intakeData?.estimated_value;
  const retainer = intakeData?.invoice?.retainer;

  return (
    <div
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Success seal */}
      <div className="text-center mb-10">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div
            className="absolute w-24 h-24 rounded-full bg-[#C6A55A]/8 animate-ping"
            style={{ animationDuration: "2.5s" }}
          />
          <div className="relative w-20 h-20 rounded-full bg-[#C6A55A]/10 border border-[#C6A55A]/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-[#C6A55A]" />
          </div>
        </div>

        <p className="ms-eyebrow mb-3">Matter Received</p>
        <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-4">
          Your matter is in the system.
        </h1>
        <p className="text-[#B0B0B0] text-lg font-light max-w-md mx-auto">
          Every detail has been captured. Nicholas will review and follow up
          within one business day.
        </p>

        {displayId && (
          <div className="inline-flex items-center gap-3 px-5 py-3 mt-6 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
            <span className="text-[#8A8A8A] text-sm">Reference</span>
            <span className="text-[#C6A55A] font-mono font-medium">
              {displayId}
            </span>
            <CopyButton text={displayId} />
          </div>
        )}
      </div>

      {/* Invoice summary — if we have it */}
      {lane && amount && (
        <div className="bg-[#111111] border border-[#C6A55A]/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C6A55A]" />
            <h2 className="text-[#C6A55A] text-xs font-semibold tracking-[0.2em] uppercase">
              Invoice Summary
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
              <span className="text-[#8A8A8A] text-sm">Execution Lane</span>
              <span className="text-white font-medium">{lane}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
              <span className="text-[#8A8A8A] text-sm">Total Investment</span>
              <span className="text-white font-medium">
                ${Number(amount).toLocaleString()}
              </span>
            </div>
            {retainer && (
              <div className="flex justify-between items-center py-2">
                <span className="text-[#8A8A8A] text-sm">
                  Retainer Due (50%)
                </span>
                <span className="text-[#C6A55A] font-semibold">
                  ${Number(retainer).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment section */}
      <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-4 h-4 text-[#C6A55A]" />
          <h2 className="text-[#C6A55A] text-xs font-semibold tracking-[0.2em] uppercase">
            Secure Payment — Wise
          </h2>
          {wiseInvoice?.wise_mode && wiseInvoice.wise_mode !== "production" && (
            <span
              className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.2em] uppercase border ${
                wiseInvoice.wise_mode === "test"
                  ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                  : "border-rose-500/40 text-rose-400 bg-rose-500/10"
              }`}
              title={
                wiseInvoice.wise_mode === "test"
                  ? "This payment was issued against the Wise sandbox. No real funds will move."
                  : "Wise was unreachable; using a fallback payment link."
              }
            >
              {wiseInvoice.wise_mode === "test" ? "Sandbox" : "Fallback"}
            </span>
          )}
        </div>
        <p className="text-[#8A8A8A] text-sm mb-5 font-light leading-relaxed">
          Payment is required before scheduling can begin. Once confirmed, your
          matter moves to execution immediately.
        </p>

        {/* Wise — primary */}
        {wiseInvoice && wiseInvoice.wise_link && (
          <>
            <a
              href={wiseInvoice.wise_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#C6A55A] text-[#0A0A0A] font-semibold rounded-xl hover:bg-[#D4B76A] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(198,165,90,0.3)] mb-5"
            >
              <CreditCard className="w-4 h-4" />
              Pay Securely with Wise
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4 mb-4">
              <p className="text-[#C6A55A] text-[10px] font-semibold tracking-[0.2em] uppercase mb-3">
                Use this reference when paying
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#8A8A8A] text-xs">Amount</span>
                  <span className="text-white text-sm font-medium">
                    ${Number(wiseInvoice.amount).toLocaleString()} USD
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#8A8A8A] text-xs">Reference</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C6A55A] font-mono text-sm">
                      {wiseInvoice.reference}
                    </span>
                    <CopyButton text={wiseInvoice.reference} />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[#8A8A8A] text-xs flex-shrink-0">
                    Note
                  </span>
                  <span className="text-[#B0B0B0] text-xs text-right max-w-[60%]">
                    {wiseInvoice.note}
                  </span>
                </div>
              </div>
              <p className="text-[#8A8A8A] text-[11px] italic mt-3 leading-relaxed">
                Add the reference exactly as shown so your matter is matched
                automatically on receipt.
              </p>
            </div>
          </>
        )}

        {!wiseInvoice && (
          <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4 mb-4">
            <p className="text-[#B0B0B0] text-sm leading-relaxed">
              Nicholas will send your Wise payment link and reference via
              WhatsApp shortly. Reply to that message to confirm and lock in
              your scheduling slot.
            </p>
          </div>
        )}

        <p className="text-[#8A8A8A] text-xs italic">
          Wise is the primary payment method. Alternative methods (Zelle, ACH,
          wire) available on request — Nicholas will coordinate directly.
        </p>
      </div>

      {/* Next steps */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: MessageCircle,
            title: "Direct Contact",
            desc: "Nicholas will reach out via WhatsApp with payment instructions and next steps.",
          },
          {
            icon: Clock,
            title: "Compliance Review",
            desc: "Jurisdiction requirements and execution path confirmed before scheduling.",
          },
          {
            icon: Shield,
            title: "Secure Execution",
            desc: "Once payment is confirmed, your matter enters execution immediately.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-5 hover:border-[#2A2A2A] transition-colors"
          >
            <div className="inline-flex p-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
              <Icon className="w-4 h-4 text-[#C6A55A]" />
            </div>
            <h3 className="text-white font-medium text-sm mb-2">{title}</h3>
            <p className="text-[#8A8A8A] text-xs leading-relaxed font-light">
              {desc}
            </p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="text-sm text-[#8A8A8A] hover:text-[#C6A55A] transition-colors"
        >
          ← Return to The Milano Seal™
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <Suspense
            fallback={
              <div className="space-y-4">
                {[80, 200, 150, 100].map((h, i) => (
                  <div
                    key={i}
                    className="ms-skeleton rounded-2xl"
                    style={{ height: h }}
                  />
                ))}
              </div>
            }
          >
            <ConfirmationInner />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  );
}
