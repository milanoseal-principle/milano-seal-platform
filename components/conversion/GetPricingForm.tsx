"use client";

import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CONCIERGE_SERVICE_INTENTS, type ConciergeServiceIntent } from "@/lib/acquisition/concierge-service-intents";

// A low-friction, concierge-style pricing request. The visitor never needs to
// know their execution route: "Not sure — review my document" is the default.
// No internal or tier prices are shown; a private quote follows Milano review.
const SERVICE_LABELS: Record<ConciergeServiceIntent, string> = {
  witness: "Witness support",
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

const inputCls =
  "mt-2 min-h-12 w-full border border-white/15 bg-black/40 px-4 text-base text-white outline-none focus:border-[#C6A55A] focus:ring-2 focus:ring-[#C6A55A]/30";
const selectCls =
  "mt-2 min-h-12 w-full border border-white/15 bg-[#111] px-4 text-base text-white outline-none focus:border-[#C6A55A] focus:ring-2 focus:ring-[#C6A55A]/30";

export function GetPricingForm({
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
  const [files, setFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<{ status: "idle" | "uploading" | "ok" | "attention"; count: number; errors: string[] }>({ status: "idle", count: 0, errors: [] });

  // Optional documents attach AFTER the request is persisted, so an upload
  // problem never loses the pricing request. Retry reuses the same reference
  // and the same files, which the server dedupes by content hash.
  async function uploadDocuments(reference: string, list: File[]) {
    if (!list.length) return;
    setUploadState({ status: "uploading", count: 0, errors: [] });
    try {
      const fd = new FormData();
      fd.append("request_id", reference);
      for (const file of list) fd.append("files", file);
      const response = await fetch("/api/pricing/request/upload", { method: "POST", body: fd });
      const body = await response.json() as { ok?: boolean; uploaded?: unknown[]; errors?: string[]; requires_attention?: boolean };
      const errors = body.errors ?? [];
      if (!response.ok && response.status !== 207) {
        setUploadState({ status: "attention", count: body.uploaded?.length ?? 0, errors: errors.length ? errors : ["We could not attach your documents. Please retry."] });
        return;
      }
      setUploadState({
        status: body.requires_attention || errors.length ? "attention" : "ok",
        count: body.uploaded?.length ?? 0,
        errors,
      });
    } catch {
      setUploadState({ status: "attention", count: 0, errors: ["We could not confirm your documents were attached. Please retry."] });
    }
  }

  const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png";
  function pickFiles(list: FileList | null) {
    if (!list) return;
    const allowed = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"]);
    const next: File[] = [];
    for (const file of Array.from(list)) {
      if (file.size > 20 * 1024 * 1024 || !allowed.has(file.type)) continue;
      next.push(file);
    }
    setFiles(next.slice(0, 10));
  }

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
    // A stable idempotency key for the life of this attempt: a retry after a
    // network blip reuses it, so one request never becomes two leads.
    requestId.current ??= crypto.randomUUID();
    const originatingPage = attribution.originating_page || document.referrer || "/pricing";

    try {
      const response = await fetch("/api/pricing/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId.current,
          full_name: values.get("full_name"),
          email: values.get("email"),
          phone: values.get("phone"),
          audience: values.get("audience"),
          service_intent: values.get("service_intent"),
          execution_preference: values.get("execution_preference"),
          document_type: values.get("document_type"),
          document_origin: values.get("document_origin"),
          signer_location: values.get("signer_location"),
          destination: values.get("destination"),
          deadline: values.get("deadline"),
          urgency: values.get("urgency"),
          execution_status: values.get("execution_status"),
          apostille_known: values.get("apostille_known"),
          delivery_preference: values.get("delivery_preference"),
          description: values.get("description"),
          originating_page: originatingPage,
          attribution,
          website: values.get("website"),
        }),
      });
      const body = await response.json() as { ok?: boolean; error?: string; reference?: string; notification?: string };
      if (!response.ok || !body.ok || !body.reference) {
        // 409 means the facts changed under this key; start a fresh key so the
        // visitor can resubmit cleanly.
        if (response.status === 409) requestId.current = null;
        setError(body.error || "Your request was not recorded. Please review the form and try again.");
        return;
      }
      const reference = body.reference;
      requestId.current = null;
      setReceipt({ reference, notification: body.notification ?? "unavailable" });
      form.reset();
      if (files.length) void uploadDocuments(reference, files);
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
        <h2 className="mt-4 font-serif text-2xl text-white">Your pricing request is recorded.</h2>
        <p className="mt-3 text-sm leading-6 text-white/65">
          Reference {receipt.reference}. A Milano reviewer will confirm your route and send a private quote. This does not create a Matter, quote, payment, or appointment.
        </p>
        <p className="mt-2 text-sm leading-6 text-white/50">
          {notificationAccepted
            ? "The operator email provider accepted an alert; final delivery is not confirmed."
            : "An operator email alert could not be confirmed. Your request remains in the Lead Pipeline."}
        </p>
        {uploadState.status === "uploading" && (
          <p className="mt-4 text-sm leading-6 text-white/65" aria-live="polite">Attaching your documents…</p>
        )}
        {uploadState.status === "ok" && uploadState.count > 0 && (
          <p className="mt-4 text-sm leading-6 text-white/65">{uploadState.count} document{uploadState.count === 1 ? "" : "s"} attached for Milano review.</p>
        )}
        {uploadState.status === "attention" && (
          <div className="mt-4 border border-amber-400/30 bg-amber-400/5 p-4" role="alert">
            <p className="text-sm font-semibold text-amber-200">Request received — document upload needs attention.</p>
            <p className="mt-1 text-sm leading-6 text-white/60">Your pricing request is safely recorded. Some documents did not finish uploading; you can retry, or send them after Milano contacts you.</p>
            {uploadState.errors.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-white/50">
                {uploadState.errors.map((message) => <li key={message}>{message}</li>)}
              </ul>
            )}
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => uploadDocuments(receipt.reference, files)}
                className="mt-3 inline-flex min-h-11 items-center gap-2 border border-[#C6A55A]/40 px-4 text-sm text-[#E1C78F] hover:bg-[#C6A55A]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A55A]"
              >
                Retry document upload
              </button>
            )}
          </div>
        )}
        <a
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-[#E1C78F] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A55A]"
          href={`mailto:nicholas@themilanoseal.com?subject=${encodeURIComponent(`Pricing request ${receipt.reference}`)}`}
        >
          Email Nicholas directly <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" aria-describedby={error ? "pricing-form-error" : undefined}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm text-white/75">
          Name <span aria-hidden="true" className="text-[#C6A55A]">*</span>
          <input name="full_name" autoComplete="name" required maxLength={160} className={inputCls} />
        </label>
        <label className="block text-sm text-white/75">
          Email <span aria-hidden="true" className="text-[#C6A55A]">*</span>
          <input name="email" type="email" autoComplete="email" required maxLength={254} className={inputCls} />
        </label>
        <label className="block text-sm text-white/75">
          Phone <span className="text-white/40">(optional)</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={40} className={inputCls} />
        </label>
        <label className="block text-sm text-white/75">
          I am requesting pricing as
          <select name="audience" defaultValue={initialAudience ?? "individual"} className={selectCls}>
            <option value="individual">An individual</option>
            <option value="professional">A professional / counsel</option>
          </select>
        </label>
        <label className="block text-sm text-white/75 sm:col-span-2">
          What do you need?
          <select name="service_intent" defaultValue={initialServiceIntent ?? "unsure"} className={selectCls}>
            {CONCIERGE_SERVICE_INTENTS.map((value) => <option key={value} value={value}>{SERVICE_LABELS[value]}</option>)}
          </select>
        </label>
        <label className="block text-sm text-white/75">
          Preferred execution method (subject to review)
          <select name="execution_preference" defaultValue={initialServiceIntent === "ron" ? "ron" : "review_required"} className={selectCls}>
            <option value="review_required">Not sure, review my document</option>
            <option value="ron">Remote online notarization</option>
            <option value="in_person">In person notarization</option>
            <option value="mobile">Mobile notary visit</option>
          </select>
        </label>
        <label className="block text-sm text-white/75">
          Document type <span className="text-white/40">(if known)</span>
          <input name="document_type" maxLength={200} className={inputCls} placeholder="e.g. power of attorney, birth certificate" />
        </label>
        <label className="block text-sm text-white/75">
          Document origin <span className="text-white/40">(issuing state / country)</span>
          <input name="document_origin" maxLength={200} className={inputCls} placeholder="e.g. Florida, USA" />
        </label>
        <label className="block text-sm text-white/75">
          Signer location <span className="text-white/40">(if a signer is needed)</span>
          <input name="signer_location" maxLength={200} className={inputCls} placeholder="City, state and country" />
        </label>
        <label className="block text-sm text-white/75">
          Destination / country of use <span className="text-white/40">(if known)</span>
          <input name="destination" defaultValue={initialDestination} autoComplete="country-name" maxLength={100} className={inputCls} />
        </label>
        <label className="block text-sm text-white/75">
          Current notarization / execution status
          <select name="execution_status" defaultValue="" className={selectCls}>
            <option value="">Not sure</option>
            <option value="not_started">Not yet executed / notarized</option>
            <option value="already_notarized">Already notarized / executed</option>
            <option value="already_certified">Already certified / issued</option>
          </select>
        </label>
        <label className="block text-sm text-white/75">
          Apostille / authentication needed? <span className="text-white/40">(if known)</span>
          <select name="apostille_known" defaultValue="" className={selectCls}>
            <option value="">Not sure — review my document</option>
            <option value="yes">Yes, I believe it is required</option>
            <option value="no">No</option>
            <option value="unsure">Unsure</option>
          </select>
        </label>
        <label className="block text-sm text-white/75">
          Delivery requirement <span className="text-white/40">(if known)</span>
          <select name="delivery_preference" defaultValue="" className={selectCls}>
            <option value="">Confirm during review</option>
            <option value="digital">Digital return</option>
            <option value="domestic_courier">Domestic courier</option>
            <option value="international_courier">International courier</option>
          </select>
        </label>
        <label className="block text-sm text-white/75">
          Deadline / urgency <span className="text-white/40">(if known)</span>
          <input name="deadline" maxLength={120} className={inputCls} placeholder="e.g. needed by March 15" />
        </label>
        <label className="block text-sm text-white/75">
          Timing
          <select name="urgency" defaultValue={initialUrgency ?? "routine"} className={selectCls}>
            <option value="routine">No urgent deadline</option>
            <option value="time_sensitive">I have a time-sensitive deadline</option>
            <option value="urgent">Urgent — please review the details</option>
          </select>
        </label>
      </div>
      <label className="block text-sm text-white/75">
        Short description of your matter <span aria-hidden="true" className="text-[#C6A55A]">*</span>
        <textarea name="description" required minLength={10} maxLength={2000} rows={5} className="mt-2 w-full border border-white/15 bg-black/40 px-4 py-3 text-base leading-6 text-white outline-none focus:border-[#C6A55A] focus:ring-2 focus:ring-[#C6A55A]/30" placeholder="Tell us what you need and how the document will be used. If you are not sure what's required, that's fine — we will review it." />
      </label>
      <div>
        <label htmlFor="pricing-files" className="block text-sm text-white/75">
          Attach documents <span className="text-white/40">(optional)</span>
        </label>
        <input
          id="pricing-files"
          name="pricing-files"
          type="file"
          multiple
          accept={ACCEPT}
          onChange={(e) => pickFiles(e.target.files)}
          className="mt-2 block w-full text-sm text-white/70 file:mr-4 file:min-h-11 file:border-0 file:bg-[#C6A55A]/90 file:px-4 file:text-sm file:font-semibold file:text-[#0A0A0A] hover:file:bg-[#D4B76A]"
        />
        <p className="mt-2 text-xs leading-5 text-white/40">
          PDF, Word, JPG or PNG. Up to 10 files, 20 MB each. Documents are stored privately for Milano review and are never shown publicly. You can also submit without documents and send them after review.
        </p>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-white/55">
            {files.map((file) => <li key={`${file.name}-${file.size}`}>{file.name} ({Math.ceil(file.size / 1024)} KB)</li>)}
          </ul>
        )}
      </div>
      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {error && <p ref={errorRef} id="pricing-form-error" role="alert" tabIndex={-1} className="text-sm text-red-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-300">{error}</p>}
      <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-3 bg-[#C6A55A] px-6 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#D4B76A] disabled:cursor-wait disabled:opacity-70 sm:w-auto">
        {busy ? "Recording request…" : "Request my reviewed quote"}
        {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
      <p className="text-xs leading-5 text-white/40">Please do not include passport numbers, payment details, or confidential legal documents. Requesting pricing does not create a Matter, appointment, or payment, and does not confirm your execution route — Milano review confirms the route and your private quote.</p>
    </form>
  );
}
