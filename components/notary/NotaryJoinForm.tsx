"use client";
import { useState } from 'react';

import { CheckCircle, ArrowRight, AlertCircle } from "lucide-react";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

const SPECIALTIES = [
  "Real Estate / Title",
  "Power of Attorney",
  "Estate / Probate",
  "International Documents",
  "Corporate / Business",
  "Immigration",
  "Loan Signing",
  "Medical / HIPAA",
  "Apostille Support",
];

export function NotaryJoinForm() {
  const [step, setStep] = useState<"form" | "submitted">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    state_of_commission: "Florida",
    commission_number: "",
    commission_expiry: "",
    is_ron_certified: false,
    ron_platform: "",
    is_mobile_notary: false,
    service_counties: [] as string[],
    years_experience: "",
    specialties: [] as string[],
    has_eo_insurance: false,
    eo_carrier: "",
    eo_policy_number: "",
    eo_expiry: "",
    linkedin_url: "",
    notes: "",
  });

  function toggleSpecialty(s: string) {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter(x => x !== s)
        : [...f.specialties, s],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.full_name || !form.email || !form.state_of_commission) {
      setError("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/notary/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, years_experience: Number(form.years_experience) || 0 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed.");
      setStep("submitted");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "submitted") {
    return (
      <div className="bg-[#0A0A0A] border border-emerald-500/20 rounded-2xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-semibold mb-2">Application Received</h2>
        <p className="text-[#8A8A8A] text-sm leading-relaxed max-w-sm mx-auto">
          Thank you for applying to the Alliance Notary Network. Our team will review your
          application and reach out to you at <span className="text-white">{form.email}</span> within
          3–5 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Personal Info */}
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
        <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase">Contact Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[#8A8A8A] text-xs mb-1.5 block">Full Legal Name *</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
              required
              className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
            />
          </div>
          <div>
            <label className="text-[#8A8A8A] text-xs mb-1.5 block">Email Address *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
            />
          </div>
          <div>
            <label className="text-[#8A8A8A] text-xs mb-1.5 block">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
            />
          </div>
          <div>
            <label className="text-[#8A8A8A] text-xs mb-1.5 block">LinkedIn (optional)</label>
            <input
              value={form.linkedin_url}
              onChange={(e) => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
              placeholder="https://linkedin.com/in/…"
              className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Commission */}
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
        <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase">Notary Commission</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[#8A8A8A] text-xs mb-1.5 block">State of Commission *</label>
            <select
              value={form.state_of_commission}
              onChange={(e) => setForm(f => ({ ...f, state_of_commission: e.target.value }))}
              className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
            >
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[#8A8A8A] text-xs mb-1.5 block">Commission Number</label>
            <input
              value={form.commission_number}
              onChange={(e) => setForm(f => ({ ...f, commission_number: e.target.value }))}
              className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
            />
          </div>
          <div>
            <label className="text-[#8A8A8A] text-xs mb-1.5 block">Commission Expiry</label>
            <input
              type="date"
              value={form.commission_expiry}
              onChange={(e) => setForm(f => ({ ...f, commission_expiry: e.target.value }))}
              className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
            />
          </div>
          <div>
            <label className="text-[#8A8A8A] text-xs mb-1.5 block">Years of Experience</label>
            <input
              type="number"
              min="0"
              value={form.years_experience}
              onChange={(e) => setForm(f => ({ ...f, years_experience: e.target.value }))}
              className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
        <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase">Capabilities</p>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_ron_certified}
              onChange={(e) => setForm(f => ({ ...f, is_ron_certified: e.target.checked }))}
              className="accent-[#C6A55A] w-4 h-4"
            />
            <span className="text-sm text-white">I am RON (Remote Online Notarization) certified</span>
          </label>
          {form.is_ron_certified && (
            <div className="ml-7">
              <label className="text-[#8A8A8A] text-xs mb-1.5 block">RON Platform(s) used</label>
              <input
                value={form.ron_platform}
                onChange={(e) => setForm(f => ({ ...f, ron_platform: e.target.value }))}
                placeholder="e.g. BlueNotary, Notarize, Proof"
                className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
              />
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_mobile_notary}
              onChange={(e) => setForm(f => ({ ...f, is_mobile_notary: e.target.checked }))}
              className="accent-[#C6A55A] w-4 h-4"
            />
            <span className="text-sm text-white">I am available for mobile / in-person assignments</span>
          </label>
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
        <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase">Specialties (select all that apply)</p>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => toggleSpecialty(s)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                form.specialties.includes(s)
                  ? "bg-[#C6A55A]/20 border-[#C6A55A]/50 text-[#C6A55A]"
                  : "border-[#2A2A2A] text-[#6A6A6A] hover:border-[#4A4A4A] hover:text-[#8A8A8A]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* E&O Insurance */}
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase">E&amp;O Insurance</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.has_eo_insurance}
              onChange={(e) => setForm(f => ({ ...f, has_eo_insurance: e.target.checked }))}
              className="accent-[#C6A55A] w-4 h-4"
            />
            <span className="text-xs text-[#8A8A8A]">I carry E&amp;O insurance</span>
          </label>
        </div>
        {form.has_eo_insurance && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1.5 block">Carrier</label>
              <input
                value={form.eo_carrier}
                onChange={(e) => setForm(f => ({ ...f, eo_carrier: e.target.value }))}
                className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
              />
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1.5 block">Policy Number</label>
              <input
                value={form.eo_policy_number}
                onChange={(e) => setForm(f => ({ ...f, eo_policy_number: e.target.value }))}
                className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
              />
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1.5 block">Policy Expiry</label>
              <input
                type="date"
                value={form.eo_expiry}
                onChange={(e) => setForm(f => ({ ...f, eo_expiry: e.target.value }))}
                className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-5">
        <label className="text-[#8A8A8A] text-xs mb-1.5 block">Additional Notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={3}
          placeholder="Any additional information about your qualifications, availability, or experience…"
          className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-sm rounded-lg px-4 py-2.5 focus:border-[#C6A55A]/50 outline-none resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#C6A55A] text-[#0A0A0A] font-semibold rounded-xl hover:bg-[#D4B76A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting…" : "Submit Application"}
        {!submitting && <ArrowRight className="w-5 h-5" />}
      </button>
    </form>
  );
}
