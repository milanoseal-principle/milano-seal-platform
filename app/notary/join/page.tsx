"use client";
import { useState } from 'react';

import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function NotaryJoinPage() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    state_commissioned: "", commission_number: "", commission_expiration: "",
    ron_authorized: false, ron_platforms_used: "", blue_notary_experience: false,
    remote_online_notary_certification: false,
    e_and_o_insurance_provider: "", e_and_o_policy_limit: "",
    background_check_status: "", languages: "", availability: "",
    mobile_notary_available: false, apostille_experience: false,
    international_document_experience: false, shipping_dropoff_access: false,
    preferred_service_area: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/notary/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json() as { ok?: boolean; message?: string; error?: string };
      setResult({ ok: res.ok, message: json.message, error: json.error });
    } catch {
      setResult({ ok: false, error: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const lbl = "block font-mono text-[9px] tracking-[0.18em] uppercase text-[#C6A55A]/70 mb-1.5";
  const inp = "w-full bg-[#0A0A0A] border border-[#C6A55A]/15 px-3 py-2.5 text-white text-sm outline-none focus:border-[#C6A55A]/40 rounded-sm transition-colors placeholder-white/20";
  const chkLabel = "flex items-center gap-3 cursor-pointer";
  const chk = "accent-[#C6A55A] w-4 h-4 flex-shrink-0";

  if (result?.ok) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#070504] flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-full border border-[#C6A55A]/40 flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(198,165,90,0.06)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/milano-seal-feather-m-orb.png" alt="" aria-hidden width={36} height={36} />
            </div>
            <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#C6A55A]/70 mb-4">Application Received</p>
            <h1 className="font-serif text-2xl text-white mb-4">Thank you for applying</h1>
            <p className="text-[#8A8A8A] text-sm leading-relaxed">{result.message}</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#070504] pb-20 px-4 sm:px-6" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#C6A55A]/70 mb-3">
              The Milano Seal™ · Notary Network
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Notary Application
            </h1>
            <p className="text-[#8A8A8A] text-sm leading-relaxed max-w-lg">
              Join our credentialed notary network for document execution, apostille coordination, and remote online notarization. Florida-based operations with international document reach.
            </p>
            <div className="mt-4 w-16 h-px" style={{ background: "linear-gradient(90deg, rgba(198,165,90,0.5), transparent)" }} />
          </div>

          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-8">
            {/* Personal */}
            <section>
              <p className="font-mono text-[8px] tracking-[0.32em] uppercase text-[#C6A55A]/50 mb-5 pb-2 border-b border-[#C6A55A]/10">Personal Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Full Name *</label><input className={inp} value={form.full_name} onChange={e => set("full_name", e.target.value)} required /></div>
                <div><label className={lbl}>Email *</label><input className={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} required /></div>
                <div><label className={lbl}>Phone *</label><input className={inp} type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} required /></div>
              </div>
            </section>

            {/* Commission */}
            <section>
              <p className="font-mono text-[8px] tracking-[0.32em] uppercase text-[#C6A55A]/50 mb-5 pb-2 border-b border-[#C6A55A]/10">Commission Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>State Commissioned *</label><input className={inp} value={form.state_commissioned} onChange={e => set("state_commissioned", e.target.value)} placeholder="Florida" required /></div>
                <div><label className={lbl}>Commission Number *</label><input className={inp} value={form.commission_number} onChange={e => set("commission_number", e.target.value)} required /></div>
                <div><label className={lbl}>Commission Expiration</label><input className={inp} type="date" value={form.commission_expiration} onChange={e => set("commission_expiration", e.target.value)} /></div>
              </div>
            </section>

            {/* RON */}
            <section>
              <p className="font-mono text-[8px] tracking-[0.32em] uppercase text-[#C6A55A]/50 mb-5 pb-2 border-b border-[#C6A55A]/10">Remote Online Notarization</p>
              <div className="space-y-4">
                <label className={chkLabel}>
                  <input type="checkbox" className={chk} checked={form.ron_authorized} onChange={e => set("ron_authorized", e.target.checked)} />
                  <span className="text-sm text-white/70">RON Authorized</span>
                </label>
                <div><label className={lbl}>RON Platforms Used</label><input className={inp} value={form.ron_platforms_used} onChange={e => set("ron_platforms_used", e.target.value)} placeholder="Notarize, Proof, BlueNotary…" /></div>
                <label className={chkLabel}><input type="checkbox" className={chk} checked={form.blue_notary_experience} onChange={e => set("blue_notary_experience", e.target.checked)} /><span className="text-sm text-white/70">BlueNotary experience</span></label>
                <label className={chkLabel}><input type="checkbox" className={chk} checked={form.remote_online_notary_certification} onChange={e => set("remote_online_notary_certification", e.target.checked)} /><span className="text-sm text-white/70">RON certified</span></label>
              </div>
            </section>

            {/* E&O */}
            <section>
              <p className="font-mono text-[8px] tracking-[0.32em] uppercase text-[#C6A55A]/50 mb-5 pb-2 border-b border-[#C6A55A]/10">Insurance & Background</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>E&amp;O Insurance Provider</label><input className={inp} value={form.e_and_o_insurance_provider} onChange={e => set("e_and_o_insurance_provider", e.target.value)} /></div>
                <div><label className={lbl}>E&amp;O Policy Limit</label><input className={inp} value={form.e_and_o_policy_limit} onChange={e => set("e_and_o_policy_limit", e.target.value)} placeholder="$25,000" /></div>
                <div><label className={lbl}>Background Check Status</label>
                  <select className={inp} value={form.background_check_status} onChange={e => set("background_check_status", e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Pending">Pending</option>
                    <option value="Not completed">Not completed</option>
                    <option value="Will provide upon approval">Will provide upon approval</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Capabilities */}
            <section>
              <p className="font-mono text-[8px] tracking-[0.32em] uppercase text-[#C6A55A]/50 mb-5 pb-2 border-b border-[#C6A55A]/10">Capabilities</p>
              <div className="space-y-4">
                <div><label className={lbl}>Languages</label><input className={inp} value={form.languages} onChange={e => set("languages", e.target.value)} placeholder="English, Spanish…" /></div>
                <div><label className={lbl}>Availability</label><input className={inp} value={form.availability} onChange={e => set("availability", e.target.value)} placeholder="Weekdays 9am–5pm, evenings by request…" /></div>
                <label className={chkLabel}><input type="checkbox" className={chk} checked={form.mobile_notary_available} onChange={e => set("mobile_notary_available", e.target.checked)} /><span className="text-sm text-white/70">Mobile notary available</span></label>
                <label className={chkLabel}><input type="checkbox" className={chk} checked={form.apostille_experience} onChange={e => set("apostille_experience", e.target.checked)} /><span className="text-sm text-white/70">Apostille coordination experience</span></label>
                <label className={chkLabel}><input type="checkbox" className={chk} checked={form.international_document_experience} onChange={e => set("international_document_experience", e.target.checked)} /><span className="text-sm text-white/70">International document experience</span></label>
                <label className={chkLabel}><input type="checkbox" className={chk} checked={form.shipping_dropoff_access} onChange={e => set("shipping_dropoff_access", e.target.checked)} /><span className="text-sm text-white/70">Shipping / dropoff access</span></label>
                <div><label className={lbl}>Preferred Service Area</label><input className={inp} value={form.preferred_service_area} onChange={e => set("preferred_service_area", e.target.value)} placeholder="Tampa Bay, Hillsborough County…" /></div>
              </div>
            </section>

            {/* Notes */}
            <section>
              <p className="font-mono text-[8px] tracking-[0.32em] uppercase text-[#C6A55A]/50 mb-5 pb-2 border-b border-[#C6A55A]/10">Additional Notes</p>
              <textarea
                className={`${inp} min-h-[100px]`}
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Any additional information relevant to your application…"
              />
            </section>

            {result?.error && (
              <div className="rounded border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300/70 font-mono">
                {result.error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#C6A55A] text-[#0A0A0A] font-mono text-[10px] uppercase tracking-[0.22em] rounded-sm disabled:opacity-50 hover:bg-[#D4B76A] transition-colors"
            >
              {submitting ? "Submitting…" : "Submit Application"}
            </button>

            <p className="text-center font-mono text-[8.5px] text-white/20 tracking-[0.1em]">
              Protected application · Matter-level controls · Credential review required
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
