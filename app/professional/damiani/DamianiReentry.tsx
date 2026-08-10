"use client";

import { useState } from "react";
import Link from "next/link";

type Lang = "it" | "en";

const COPY: Record<
  Lang,
  {
    welcome: string;
    intro: string;
    verified: string;
    primary: string;
    secondary: string;
    courtesyRecognized: string;
    courtesyNotRequested: string;
    switchLabel: string;
    reviewNote: string;
  }
> = {
  it: {
    welcome: "Bentornata, Avv. Damiani",
    intro:
      "Come ringraziamento per la fiducia accordata a The Milano Seal, il codice di cortesia DAMIANI50 dà diritto a uno sconto del 50% sul prossimo servizio idoneo di notarizzazione, esecuzione documentale o coordinamento dell’apostille negli Stati Uniti.",
    verified: "Lo sconto sarà verificato e applicato prima del pagamento.",
    primary: "Avvia una nuova pratica",
    secondary: "Richiedi assistenza",
    courtesyRecognized:
      "Codice di cortesia DAMIANI50 riconosciuto per la verifica. L’idoneità sarà verificata dal sistema e l’adeguamento applicato solo dopo la verifica dell’identità professionale.",
    courtesyNotRequested:
      "Se dispone del codice di cortesia DAMIANI50, potrà inserirlo nel percorso di preventivo prima del pagamento. Nessuno sconto viene applicato automaticamente senza verifica.",
    switchLabel: "English",
    reviewNote:
      "The Milano Seal esaminerà il percorso di esecuzione proposto e confermerà i requisiti operativi prima di formulare un preventivo o programmare il servizio.",
  },
  en: {
    welcome: "Welcome back, Avv. Damiani",
    intro:
      "As a sincere thank-you for the trust placed in The Milano Seal, courtesy code DAMIANI50 provides 50% off the next eligible U.S.-based notarization, document-execution, or apostille-coordination service.",
    verified: "The courtesy adjustment will be verified and applied before payment.",
    primary: "Start a new matter",
    secondary: "Request assistance",
    courtesyRecognized:
      "Courtesy code DAMIANI50 recognized for verification. Eligibility will be verified by the system and the adjustment applied only after professional identity verification.",
    courtesyNotRequested:
      "If you have courtesy code DAMIANI50, you can enter it during the quote flow before payment. No discount is applied automatically without verification.",
    switchLabel: "Italiano",
    reviewNote:
      "The Milano Seal will review the proposed execution route and confirm operational requirements before quoting or scheduling.",
  },
};

const GOLD = "#C6A55A";

export function DamianiReentry({
  initialLang,
  courtesyRequested,
}: {
  initialLang: Lang;
  courtesyRequested: boolean;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const copy = COPY[lang];

  // Carry only a courtesy-routing signal into intake. The backend remains
  // authoritative for code validity, professional identity, eligible subtotal,
  // redemption lifecycle, and final Wise amount.
  const intakeHref = courtesyRequested
    ? "/intake?lane=professional&courtesy=DAMIANI50&source=damiani-reentry"
    : "/intake?lane=professional&source=damiani-reentry";

  const assistanceSubject = encodeURIComponent(
    lang === "it"
      ? "Richiesta di assistenza — accesso professionale"
      : "Assistance request — professional access",
  );
  const assistanceHref = `mailto:nicholas@themilanoseal.com?subject=${assistanceSubject}`;

  return (
    <section
      className="px-4 sm:px-6 pb-20"
      style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top) + 1.5rem)" }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setLang(lang === "it" ? "en" : "it")}
            className="min-h-[44px] px-4 rounded-full border text-[15px] transition-colors"
            style={{ borderColor: "rgba(198,165,90,0.5)", color: GOLD }}
            aria-label={lang === "it" ? "Switch to English" : "Passa all’italiano"}
          >
            {copy.switchLabel}
          </button>
        </div>

        <div className="mt-2 text-center sm:text-left">
          <p className="text-[13px] uppercase tracking-[0.2em] text-white/40">
            The Milano Seal™
          </p>
          <h1
            className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-serif, serif)", color: GOLD }}
          >
            {copy.welcome}
          </h1>

          <p className="mt-6 text-[17px] leading-relaxed text-white/80">
            {copy.intro}
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-white/60">
            {copy.verified}
          </p>

          <div
            className="mt-6 rounded-xl border px-4 py-3 text-[15px] leading-relaxed"
            style={{
              borderColor: "rgba(198,165,90,0.35)",
              background: "rgba(198,165,90,0.06)",
              color: "rgba(255,255,255,0.82)",
            }}
            role="status"
          >
            {courtesyRequested
              ? copy.courtesyRecognized
              : copy.courtesyNotRequested}
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href={intakeHref}
            className="inline-flex items-center justify-center min-h-[54px] px-8 rounded-full font-medium text-[17px] text-black transition-transform active:scale-[0.99]"
            style={{ background: GOLD }}
          >
            {copy.primary}
          </Link>
          <a
            href={assistanceHref}
            className="inline-flex items-center justify-center min-h-[54px] px-8 rounded-full font-medium text-[17px] border transition-colors"
            style={{ borderColor: "rgba(198,165,90,0.5)", color: GOLD }}
          >
            {copy.secondary}
          </a>
        </div>

        <p className="mt-10 text-[14px] leading-relaxed text-white/45 border-t border-white/10 pt-6">
          {copy.reviewNote}
        </p>
      </div>
    </section>
  );
}
