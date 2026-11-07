"use client";

import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CONCIERGE_SERVICE_INTENTS, type ConciergeServiceIntent } from "@/lib/acquisition/concierge-service-intents";

const SERVICE_LABELS: Record<ConciergeServiceIntent, string> = {
  ron: "Remote online notarization",
  domestic_execution: "Domestic document execution",
  apostille: "Apostille coordination",
  authentication: "Authentication / legalization",
  international_execution: "International document execution",
  foreign_counsel: "Foreign counsel / professional matter",
  unsure: "Not sure — review my document",
};

type Receipt = { reference: string; notification: string };
type Audience = "individual" | "professional";
type Urgency = "routine" | "urgent" | "time_sensitive";

export function NicholasContactForm({
  attribution,
  initialServiceIntent,
  initialDestination,
  initialAudience,
  initialUrgency,
}: {
  attribution: Record<string, string>;
  initialServiceIntent?: ConciergeServiceIntent;
  initialDestination?: string;
  initialAudience?: Audience;
  initialUrgency?: Urgency;
}) {
  const requestId = useRef<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const receiptRef = useRef<HTMLElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useLayoutEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useLayoutEffect(() => {
    if (receipt) receiptRef.current?.focus();
  }, [receipt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const values = new FormData(form);
    requestId.current ??= crypto.randomUUID();
    const originatingPage = attribution.originating_page || document.referrer || "/speak-with-nicholas";

    try {
      const response = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId.current,
          full_name: values.get("full_name"),
          email: values.get("email"),
          phone: values.get("phone"),
          audience: values.get("audience"),
          service_intent: values.get("service_intent"),
          destination: values.get("destination"),
          urgency: values.get("urgency"),
          question: values.get("question"),
          originating_page: originatingPage,
          attribution,
          website: values.get("website"),
        }),
      });
      const body = await response.json() as { ok?: boolean; error?: string; reference?: string; notification?: string };
      if (!response.ok || !body.ok || !body.reference) {
        if (response.status === 409) requestId.current = null;
        setError(body.error || "Your request was not recorded. Please review the form and try again.");
        return;
      }
      requestId.current = null;
      setReceipt({ reference: body.reference, notification: body.notification ?? "unavailable" });
      form.reset();
    } catch {
      setError("We could not confirm that your request was recorded. Please retry, or email Nicholas directly.");
    } finally {
      setBusy(false);
    }
  }

  if (receipt) {
    const notificationAccepted = receipt.notification === "provider_accepted";
    return (
      <section ref={receiptRef} tabIndex={-1} aria-live="polite" className="border border-[#C6A55A]/25 bg-[#0A0A0A] p-6 sm:p-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A55A]">
        <CheckCircle2 className="h-6 w-6 text-[#C6A55A]" aria-hidden="true" />
        <h2 className="mt-4 font-serif text-2xl text-white">Your inquiry is recorded.</h2>
        <p className="mt-3 text-sm leading-6 text-white/65">
          Reference {receipt.reference}. This does not create a Matter, quote, payment, or appointment.
        </p>
        <p className="mt-2 text-sm leading-6 text-white/50">
          {notificationAccepted
            ? "The operator email provider accepted an alert; final delivery is not confirmed."
            : "An operator email alert could not be confirmed. Your request remains in the Lead Pipeline."}
        </p>
        <a
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-[#E1C78F] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A55A]"
          href={`mailto:nicholas@themilanoseal.com?subject=${encodeURIComponent(`Concierge inquiry ${receipt.reference}`)}`}
        >
          Email Nicholas directly <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" aria-describedby={error ? "concierge-form-error" : undefined}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm text-white/75">
          Name <span aria-hidden="true" className="text-[#C6A55A]">*</span>
          <input name="full_name" autoComplete="name" required maxLength={160} className="mt-2 min-h-12 w-full border border-white/15 bg-black/40 px-4 text-base text-white outline-none focus:border-[#C6A55A] focus:ring-2 focus:ring-[#C6A55A]/30" />
        </label>
        <label className="block text-sm text-white/75">
          Email <span aria-hidden="true" className="text-[#C6A55A]">*</span>
          <input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-2 min-h-12 w-full border border-white/15 bg-black/40 px-4 text-base text-white outline-none focus:border-[#C6A55A] focus:ring-2 focus:ring-[#C6A55A]/30" />
        </label>
        <label className="block text-sm text-white/75">
          Phone <span className="text-white/40">(optional)</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={40} className="mt-2 min-h-12 w-full border border-white/15 bg-black/40 px-4 text-base text-white outline-none focus:border-[#C6A55A] focus:ring-2 focus:ring-[#C6A55A]/30" />
        </label>
        <label className="block text-sm text-white/75">
          I am contacting you as
          <select name="audience" defaultValue={initialAudience ?? "individual"} className="mt-2 min-h-12 w-full border border-white/15 bg-[#111] px-4 text-base text-white outline-none focus:border-[#C6A55A] focus:ring-2 focus:ring-[#C6A55A]/30">
            <option value="individual">An individual</option>
            <option value="professional">A professional / counsel</option>
          </select>
        </label>
        <label className="block text-sm text-white/75 sm:col-span-2">
          What do you need help with?
          <select name="service_intent" defaultValue={initialServiceIntent ?? "unsure"} className="mt-2 min-h-12 w-full border border-white/15 bg-[#111] px-4 text-base text-white outline-none focus:border-[#C6A55A] focus:ring-2 focus:ring-[#C6A55A]/30">
            {CONCIERGE_SERVICE_INTENTS.map((value) => <option key={value} value={value}>{SERVICE_LABELS[value]}</option>)}
          </select>
        </label>
        <label className="block text-sm text-white/75">
          Destination country <span className="text-white/40">(if known)</span>
          <input name="destination" defaultValue={initialDestination} autoComplete="country-name" maxLength={100} className="mt-2 min-h-12 w-full border border-white/15 bg-black/40 px-4 text-base text-white outline-none focus:border-[#C6A55A] focus:ring-2 focus:ring-[#C6A55A]/30" />
        </label>
        <label className="block text-sm text-white/75">
          Timing
          <select name="urgency" defaultValue={initialUrgency ?? "routine"} className="mt-2 min-h-12 w-full border border-white/15 bg-[#111] px-4 text-base text-white outline-none focus:border-[#C6A55A] focus:ring-2 focus:ring-[#C6A55A]/30">
            <option value="routine">No urgent deadline</option>
            <option value="time_sensitive">I have a time-sensitive deadline</option>
            <option value="urgent">Urgent — please review the details</option>
          </select>
        </label>
      </div>
      <label className="block text-sm text-white/75">
        How can Nicholas help? <span aria-hidden="true" className="text-[#C6A55A]">*</span>
        <textarea name="question" required minLength={10} maxLength={1500} rows={5} className="mt-2 w-full border border-white/15 bg-black/40 px-4 py-3 text-base leading-6 text-white outline-none focus:border-[#C6A55A] focus:ring-2 focus:ring-[#C6A55A]/30" />
      </label>
      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {error && <p ref={errorRef} id="concierge-form-error" role="alert" tabIndex={-1} className="text-sm text-red-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-300">{error}</p>}
      <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-3 bg-[#C6A55A] px-6 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#D4B76A] disabled:cursor-wait disabled:opacity-70 sm:w-auto">
        {busy ? "Recording request…" : "Request a conversation"}
        {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
      <p className="text-xs leading-5 text-white/40">Please do not include passport numbers, payment details, or confidential legal documents. This request does not create a Matter or appointment.</p>
    </form>
  );
}