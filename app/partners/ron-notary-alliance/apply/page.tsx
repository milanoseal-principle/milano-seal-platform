"use client";

import { useState } from "react";
import Link from "next/link";

import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

interface FormState {
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  state_commissioned: string;
  commission_number: string;
  commission_expiration: string;
  ron_authorized: boolean;
  ron_platforms_used: string;
  e_and_o_insurance_provider: string;
  e_and_o_policy_limit: string;
  background_check_status: string;
  languages: string;
  availability: string;
  mobile_notary_available: boolean;
  apostille_experience: boolean;
  international_document_experience: boolean;
  shipping_dropoff_access: boolean;
  preferred_service_area: string;
  airport_area_available: boolean;
  after_hours_available: boolean;
  weekend_available: boolean;
  documents_willing: string;
  documents_unwilling: string;
  w9_ready: boolean;
  nda_willing: boolean;
  sop_training_willing: boolean;
  acknowledgement: boolean;
}

const initialForm: FormState = {
  full_name: "",
  business_name: "",
  email: "",
  phone: "",
  state_commissioned: "",
  commission_number: "",
  commission_expiration: "",
  ron_authorized: false,
  ron_platforms_used: "",
  e_and_o_insurance_provider: "",
  e_and_o_policy_limit: "",
  background_check_status: "",
  languages: "",
  availability: "",
  mobile_notary_available: false,
  apostille_experience: false,
  international_document_experience: false,
  shipping_dropoff_access: false,
  preferred_service_area: "",
  airport_area_available: false,
  after_hours_available: false,
  weekend_available: false,
  documents_willing: "",
  documents_unwilling: "",
  w9_ready: false,
  nda_willing: false,
  sop_training_willing: false,
  acknowledgement: false,
};

export default function RonNotaryAllianceApplyPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.acknowledgement) {
      setResult({ ok: false, message: "Please acknowledge the Alliance application terms before submitting." });
      return;
    }

    setSubmitting(true);
    setResult(null);

    const operationalNotes = [
      form.business_name && `Business: ${form.business_name}`,
      `Airport area available: ${form.airport_area_available ? "yes" : "no"}`,
      `After hours available: ${form.after_hours_available ? "yes" : "no"}`,
      `Weekend available: ${form.weekend_available ? "yes" : "no"}`,
      `W-9 ready: ${form.w9_ready ? "yes" : "no"}`,
      `NDA willing: ${form.nda_willing ? "yes" : "no"}`,
      `SOP training willing: ${form.sop_training_willing ? "yes" : "no"}`,
      form.documents_willing && `Willing to handle: ${form.documents_willing}`,
      form.documents_unwilling && `Will not handle: ${form.documents_unwilling}`,
    ].filter(Boolean).join("\n");

    try {
      const response = await fetch("/api/notary/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          remote_online_notary_certification: false,
          notes: operationalNotes,
        }),
      });
      const json = await response.json() as { message?: string; error?: string };
      setResult({
        ok: response.ok,
        message: response.ok
          ? json.message ?? "Application received for review."
          : json.error ?? "Application could not be submitted.",
      });
      if (response.ok) setForm(initialForm);
    } catch {
      setResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const input = "w-full rounded-sm border border-[#C6A55A]/15 bg-[#090807] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#C6A55A]/45";
  const label = "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-[#C6A55A]/60";
  const check = "flex items-start gap-3 text-sm leading-6 text-white/55";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#080706] px-5 pb-20 text-white" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top) + 3rem)" }}>
        <div className="mx-auto max-w-3xl">
          <Link href="/partners/ron-notary-alliance" className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#C6A55A]/55 hover:text-[#C6A55A]">
            ← RON Notary Alliance
          </Link>
          <div className="mt-6 border-b border-[#C6A55A]/10 pb-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#C6A55A]/60">Credential review intake</p>
            <h1 className="mt-4 font-serif text-3xl text-[#F5E8C5] sm:text-4xl">Apply as an execution partner</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
              Provide current commission, RON capability, insurance, service-area, and availability information. Application, verification, dispatch readiness, and assignment are separate decisions.
            </p>
          </div>

          <form onSubmit={(event) => void submit(event)} className="mt-10 space-y-10">
            <section>
              <h2 className="font-serif text-xl text-white/80">Identity & commission</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><label className={label}>Full legal name *</label><input className={input} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required /></div>
                <div><label className={label}>Business name</label><input className={input} value={form.business_name} onChange={(e) => set("business_name", e.target.value)} /></div>
                <div><label className={label}>Email *</label><input type="email" className={input} value={form.email} onChange={(e) => set("email", e.target.value)} required /></div>
                <div><label className={label}>Phone *</label><input className={input} value={form.phone} onChange={(e) => set("phone", e.target.value)} required /></div>
                <div><label className={label}>State commissioned *</label><input className={input} value={form.state_commissioned} onChange={(e) => set("state_commissioned", e.target.value)} required /></div>
                <div><label className={label}>Commission number *</label><input className={input} value={form.commission_number} onChange={(e) => set("commission_number", e.target.value)} required /></div>
                <div><label className={label}>Commission expiration</label><input type="date" className={input} value={form.commission_expiration} onChange={(e) => set("commission_expiration", e.target.value)} /></div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl text-white/80">RON capability</h2>
              <p className="mt-2 text-xs leading-5 text-white/35">Do not select RON authorized unless your current state authorization or registration requirements have been completed.</p>
              <div className="mt-5 space-y-4">
                <label className={check}><input type="checkbox" checked={form.ron_authorized} onChange={(e) => set("ron_authorized", e.target.checked)} /><span>State RON authorization / registration completed where required</span></label>
                <div><label className={label}>RON platform(s)</label><input className={input} value={form.ron_platforms_used} onChange={(e) => set("ron_platforms_used", e.target.value)} placeholder="Comma-separated" /></div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl text-white/80">Insurance & verification</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><label className={label}>E&O provider</label><input className={input} value={form.e_and_o_insurance_provider} onChange={(e) => set("e_and_o_insurance_provider", e.target.value)} /></div>
                <div><label className={label}>E&O policy limit</label><input className={input} value={form.e_and_o_policy_limit} onChange={(e) => set("e_and_o_policy_limit", e.target.value)} /></div>
                <div><label className={label}>Background check status</label><select className={input} value={form.background_check_status} onChange={(e) => set("background_check_status", e.target.value)}><option value="">Select</option><option value="Cleared">Cleared</option><option value="Pending">Pending</option><option value="Will provide upon approval">Will provide upon approval</option><option value="Not completed">Not completed</option></select></div>
                <div><label className={label}>Languages</label><input className={input} value={form.languages} onChange={(e) => set("languages", e.target.value)} placeholder="English, Spanish" /></div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl text-white/80">Coverage & availability</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><label className={label}>Preferred service area</label><input className={input} value={form.preferred_service_area} onChange={(e) => set("preferred_service_area", e.target.value)} /></div>
                <div><label className={label}>Availability</label><input className={input} value={form.availability} onChange={(e) => set("availability", e.target.value)} placeholder="Weekdays, evenings by request" /></div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className={check}><input type="checkbox" checked={form.mobile_notary_available} onChange={(e) => set("mobile_notary_available", e.target.checked)} /><span>Mobile / wet-ink available</span></label>
                <label className={check}><input type="checkbox" checked={form.airport_area_available} onChange={(e) => set("airport_area_available", e.target.checked)} /><span>Airport-area availability</span></label>
                <label className={check}><input type="checkbox" checked={form.after_hours_available} onChange={(e) => set("after_hours_available", e.target.checked)} /><span>After-hours availability</span></label>
                <label className={check}><input type="checkbox" checked={form.weekend_available} onChange={(e) => set("weekend_available", e.target.checked)} /><span>Weekend availability</span></label>
                <label className={check}><input type="checkbox" checked={form.apostille_experience} onChange={(e) => set("apostille_experience", e.target.checked)} /><span>Apostille coordination experience</span></label>
                <label className={check}><input type="checkbox" checked={form.international_document_experience} onChange={(e) => set("international_document_experience", e.target.checked)} /><span>International document experience</span></label>
                <label className={check}><input type="checkbox" checked={form.shipping_dropoff_access} onChange={(e) => set("shipping_dropoff_access", e.target.checked)} /><span>Shipping / scan-back support</span></label>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl text-white/80">Matter boundaries</h2>
              <div className="mt-5 grid gap-4">
                <div><label className={label}>Documents willing to handle</label><textarea className={`${input} min-h-24`} value={form.documents_willing} onChange={(e) => set("documents_willing", e.target.value)} /></div>
                <div><label className={label}>Documents you will not handle</label><textarea className={`${input} min-h-24`} value={form.documents_unwilling} onChange={(e) => set("documents_unwilling", e.target.value)} /></div>
              </div>
            </section>

            <section className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="font-serif text-xl text-white/80">Readiness acknowledgements</h2>
              <div className="mt-5 space-y-3">
                <label className={check}><input type="checkbox" checked={form.w9_ready} onChange={(e) => set("w9_ready", e.target.checked)} /><span>W-9 available if approved</span></label>
                <label className={check}><input type="checkbox" checked={form.nda_willing} onChange={(e) => set("nda_willing", e.target.checked)} /><span>Willing to execute required confidentiality / data-handling terms</span></label>
                <label className={check}><input type="checkbox" checked={form.sop_training_willing} onChange={(e) => set("sop_training_willing", e.target.checked)} /><span>Willing to complete Milano Seal SOP training before dispatch</span></label>
                <label className={`${check} mt-5 border-t border-white/[0.06] pt-5`}><input type="checkbox" checked={form.acknowledgement} onChange={(e) => set("acknowledgement", e.target.checked)} required /><span>I understand that applying does not guarantee approval, dispatch volume, income, assignments, exclusive territory, or foreign acceptance.</span></label>
              </div>
            </section>

            {result ? <div className={`rounded border p-4 text-sm ${result.ok ? "border-emerald-400/20 bg-emerald-400/[0.04] text-emerald-200/70" : "border-red-400/20 bg-red-400/[0.04] text-red-200/70"}`}>{result.message}</div> : null}

            <button disabled={submitting} className="w-full rounded-sm bg-[#C6A55A] px-6 py-4 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#090806] disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit for Credential Review"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
