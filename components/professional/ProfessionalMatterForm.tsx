"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Copy } from "lucide-react";
import {
  Field,
  FormNotice,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./ProfessionalFormPrimitives";

type HandoffMode = "professional_submits" | "client_completes";

const EMPTY = {
  client_name: "",
  client_email: "",
  client_phone: "",
  document_type: "",
  document_origin: "",
  destination_country: "",
  signer_location: "",
  execution_posture: "unknown",
  receiving_authority: "",
  document_count: "1",
  deadline: "",
  professional_instructions: "",
};
type MatterForm = typeof EMPTY;

const ACCEPTANCE = "Final acceptance is determined by the receiving authority.";

export function ProfessionalMatterForm() {
  const [mode, setMode] = useState<HandoffMode>("professional_submits");
  const [form, setForm] = useState<MatterForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);

  // Returning professionals reuse firm-level defaults only; client PII and
  // Matter-specific legal conclusions are never prefilled across Matters.
  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/professional/account");
      if (!response.ok) return;
      const body = (await response.json()) as { defaults?: Record<string, unknown> };
      const defaults = body.defaults ?? {};
      if (defaults.default_client_handoff_mode === "client_completes") setMode("client_completes");
      const destinations = Array.isArray(defaults.preferred_destination_countries)
        ? (defaults.preferred_destination_countries as string[])
        : [];
      setForm((current) => ({
        ...current,
        destination_country: current.destination_country || destinations[0] || "",
        receiving_authority:
          current.receiving_authority || String(defaults.default_receiving_authority ?? ""),
        professional_instructions:
          current.professional_instructions || String(defaults.client_instruction_template ?? ""),
      }));
    })();
  }, []);

  const set = (key: keyof MatterForm) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    setHandoffUrl(null);
    try {
      if (mode === "client_completes") {
        const response = await fetch("/api/professional/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destination_country: form.destination_country, document_type: form.document_type }),
        });
        const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!response.ok || !body.url) throw new Error(body.error ?? "Handoff link could not be created.");
        setHandoffUrl(body.url);
        setNotice({ tone: "success", text: "Secure intake link ready. Send it to your client; the Matter links to your profile when they submit." });
      } else {
        const response = await fetch("/api/professional/matters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, document_count: Number(form.document_count) || 1 }),
        });
        const body = (await response.json().catch(() => ({}))) as { error?: string; matter_reference?: string; message?: string };
        if (!response.ok) throw new Error(body.error ?? "Matter could not be submitted.");
        setNotice({
          tone: "success",
          text: `${body.message ?? "Matter received."}${body.matter_reference ? ` Reference ${body.matter_reference}.` : ""}`,
        });
        setForm(EMPTY);
      }
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Request failed." });
    } finally {
      setBusy(false);
    }
  }

  const clientFields = mode === "professional_submits";

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">Who completes intake</legend>
        {([
          ["professional_submits", "I submit for my client"],
          ["client_completes", "Client completes secure intake"],
        ] as const).map(([value, label]) => (
          <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm ${mode === value ? "border-[#C6A65B]/45 bg-[#C6A65B]/[0.06] text-[#F6F1E6]" : "border-white/[0.08] text-white/55"}`}>
            <input type="radio" name="handoff-mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="accent-[#C6A65B]" />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {clientFields ? (
          <>
            <Field label="Client name" htmlFor="matter-client-name">
              <input id="matter-client-name" className={fieldClass} value={form.client_name} onChange={(e) => set("client_name")(e.target.value)} required />
            </Field>
            <Field label="Client email" htmlFor="matter-client-email">
              <input id="matter-client-email" type="email" className={fieldClass} value={form.client_email} onChange={(e) => set("client_email")(e.target.value)} required />
            </Field>
            <Field label="Client phone (optional)" htmlFor="matter-client-phone">
              <input id="matter-client-phone" className={fieldClass} value={form.client_phone} onChange={(e) => set("client_phone")(e.target.value)} />
            </Field>
          </>
        ) : null}
        <Field label="Document type" htmlFor="matter-document-type">
          <input id="matter-document-type" className={fieldClass} value={form.document_type} onChange={(e) => set("document_type")(e.target.value)} placeholder="Power of attorney, birth certificate…" />
        </Field>
        <Field label="Destination country" htmlFor="matter-destination">
          <input id="matter-destination" className={fieldClass} value={form.destination_country} onChange={(e) => set("destination_country")(e.target.value)} />
        </Field>
        {clientFields ? (
          <>
            <Field label="Document origin" htmlFor="matter-origin" hint="U.S. state, federal agency, or court that issued the document, if known.">
              <input id="matter-origin" className={fieldClass} value={form.document_origin} onChange={(e) => set("document_origin")(e.target.value)} />
            </Field>
            <Field label="Signer location" htmlFor="matter-signer-location">
              <input id="matter-signer-location" className={fieldClass} value={form.signer_location} onChange={(e) => set("signer_location")(e.target.value)} />
            </Field>
            <Field label="Execution posture" htmlFor="matter-posture" hint="Report what is known. The execution method and notarial act are confirmed in operator review.">
              <select id="matter-posture" className={fieldClass} value={form.execution_posture} onChange={(e) => set("execution_posture")(e.target.value)}>
                <option value="unknown">Unknown</option>
                <option value="already_issued">Already issued</option>
                <option value="already_notarized">Already notarized</option>
                <option value="signature_needed">Signature needed</option>
              </select>
            </Field>
            <Field label="Receiving authority (if known)" htmlFor="matter-authority">
              <input id="matter-authority" className={fieldClass} value={form.receiving_authority} onChange={(e) => set("receiving_authority")(e.target.value)} />
            </Field>
            <Field label="Number of documents" htmlFor="matter-count">
              <input id="matter-count" type="number" min={1} max={50} className={fieldClass} value={form.document_count} onChange={(e) => set("document_count")(e.target.value)} />
            </Field>
            <Field label="Deadline" htmlFor="matter-deadline">
              <input id="matter-deadline" type="date" className={fieldClass} value={form.deadline} onChange={(e) => set("deadline")(e.target.value)} />
            </Field>
          </>
        ) : null}
      </div>

      {clientFields ? (
        <Field label="Attorney / professional instructions" htmlFor="matter-instructions" hint="Documents are uploaded in the secure Matter room after review.">
          <textarea id="matter-instructions" className={`${fieldClass} min-h-28 py-3`} value={form.professional_instructions} onChange={(e) => set("professional_instructions")(e.target.value)} />
        </Field>
      ) : (
        <FormNotice tone="info">
          The link carries only your profile reference, destination and document type. Your client enters their own details and uploads documents in secure intake.
        </FormNotice>
      )}

      {notice ? <FormNotice tone={notice.tone}>{notice.text}</FormNotice> : null}
      {handoffUrl ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input readOnly aria-label="Secure client intake link" className={fieldClass} value={handoffUrl} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className={secondaryButtonClass} onClick={() => void navigator.clipboard?.writeText(handoffUrl)}>
            <Copy className="h-4 w-4" /> Copy
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className={primaryButtonClass} disabled={busy}>
          {busy ? "Working…" : clientFields ? "Submit Client Matter" : "Create Secure Intake Link"}
        </button>
        <Link href="/professional/matters" className={secondaryButtonClass}>Back to Matters</Link>
      </div>
      <p className="text-xs leading-5 text-white/30">
        Matter-specific execution quote issued after review. {ACCEPTANCE} The Milano Seal is not a law firm and does not provide legal advice.
      </p>
    </form>
  );
}
