"use client";
import { useState } from 'react';

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { SmartMatterIntake } from "@/components/intake/SmartMatterIntake";
import type { MatterAnalysis } from "@/lib/intake/matterAnalysis";
import { FileUploadZone } from "@/components/intake/FileUploadZone";
import { classifyIntake } from "@/lib/intake/smartClassification";
import { priceSmartIntake } from "@/lib/pricing/milanoPricingTruth";
import { projectClientPricing } from "@/lib/pricing/pricingProjections";

interface IntakeData {
  client_name: string;
  email: string;
  phone: string;
  organization: string;
  is_attorney: boolean;
  document_type: string;
  document_description: string;
  document_count: number;
  signer_count: number;
  signer_names: string;
  origin_state: string;
  destination_country: string;
  mobile_address: string;
  execution_type: "RON" | "Mobile" | "Unsure";
  apostille_required: boolean;
  apostille_count: number;
  translation_needed: boolean;
  draft_ready: boolean;
  timeline: string;
  deadline_date: string;
  weekend_holiday: boolean;
  source_detail: string;
  attribution: string;
  notes: string;
  // Optional extended fields
  matter_category: string;
  ron_preferred: string;
  wet_ink_required: string;
  receiving_authority: string;
  deadline_or_closing_date: string;
  courier_required: string;
}

interface IntakePrefill {
  country?: string;
  document?: string;
  useCase?: string;
  matter?: string;
}

interface IntakeWizardProps {
  initialTier?: "signature" | "priority" | "executive";
  prefill?: IntakePrefill;
}

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "Washington D.C.",
  "Federal (FBI)",
];

const COUNTRIES = [
  "Italy",
  "Spain",
  "Portugal",
  "Mexico",
  "Brazil",
  "Colombia",
  "France",
  "Germany",
  "Greece",
  "United Kingdom",
  "Canada",
  "Australia",
  "Netherlands",
  "Switzerland",
  "Austria",
  "Argentina",
  "Japan",
  "South Korea",
  "United Arab Emirates",
  "India",
  "South Africa",
  "New Zealand",
  "Ireland",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Romania",
  "Bulgaria",
  "Croatia",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Belgium",
  "Luxembourg",
  "Turkey",
  "Israel",
  "Qatar",
  "Saudi Arabia",
  "Other",
];

const STEP_LABELS = [
  "YOUR MATTER",
  "EXECUTION",
  "REVIEW",
];

const INITIAL_DATA: IntakeData = {
  client_name: "",
  email: "",
  phone: "",
  organization: "",
  is_attorney: false,
  document_type: "",
  document_description: "",
  document_count: 1,
  signer_count: 1,
  signer_names: "",
  origin_state: "",
  destination_country: "",
  mobile_address: "",
  execution_type: "Unsure",
  apostille_required: false,
  apostille_count: 1,
  translation_needed: false,
  draft_ready: false,
  timeline: "",
  deadline_date: "",
  weekend_holiday: false,
  source_detail: "",
  attribution: "",
  notes: "",
  // Optional extended fields
  matter_category: "",
  ron_preferred: "",
  wet_ink_required: "",
  receiving_authority: "",
  deadline_or_closing_date: "",
  courier_required: "",
};

const inputCls = `w-full px-4 py-3 bg-[#0A0A0A] border border-[rgba(198,165,90,0.15)]
  rounded-sm text-white text-sm font-light placeholder:text-[#B0B0B0]/40
  focus:outline-none focus:border-[var(--ms-gold)] transition-colors duration-200`;

const selectCls = `${inputCls} appearance-none cursor-pointer`;

const labelCls = `block text-[10px] font-semibold tracking-[0.14em] uppercase text-[var(--ms-gold)]/65 mb-2`;

const checkRowCls = `flex items-start gap-3 p-3.5 bg-[#0A0A0A] border border-[rgba(198,165,90,0.12)]
  rounded-sm cursor-pointer transition-all duration-200 hover:border-[rgba(198,165,90,0.3)]`;

function FieldGroup({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mb-5 ${className}`}>{children}</div>;
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">{children}</div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-7 first:mt-0">
      <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[var(--ms-gold)]/60">
        {children}
      </span>
      <div className="flex-1 h-px bg-[rgba(198,165,90,0.12)]" />
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <label className={checkRowCls}>
      <div
        className={`mt-0.5 w-4 h-4 rounded-sm border flex-shrink-0 flex items-center justify-center transition-all duration-150 ${
          checked
            ? "bg-[var(--ms-gold)] border-[var(--ms-gold)]"
            : "border-[rgba(198,165,90,0.3)] bg-transparent"
        }`}
      >
        {checked && (
          <Check className="w-2.5 h-2.5 text-[#0A0A0A]" strokeWidth={3} />
        )}
      </div>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <div className="text-sm text-white font-light">{label}</div>
        {sub && (
          <div className="text-[11px] text-[#9A9488] mt-0.5 font-light">
            {sub}
          </div>
        )}
      </div>
    </label>
  );
}

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; sub?: string }[];
}) {
  return (
    <div className="bg-[#0A0A0A] border border-[rgba(198,165,90,0.12)] rounded-sm overflow-hidden">
      {options.map((opt, i) => (
        <label
          key={opt.value}
          className={`flex items-start gap-3 p-3.5 cursor-pointer transition-all duration-200 hover:bg-[rgba(198,165,90,0.04)] ${
            i < options.length - 1
              ? "border-b border-[rgba(198,165,90,0.08)]"
              : ""
          } ${value === opt.value ? "bg-[rgba(198,165,90,0.06)]" : ""}`}
        >
          <div
            className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150 ${
              value === opt.value
                ? "border-[var(--ms-gold)]"
                : "border-[rgba(198,165,90,0.3)]"
            }`}
          >
            {value === opt.value && (
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ms-gold)]" />
            )}
          </div>
          <input
            type="radio"
            className="sr-only"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <div>
            <div className="text-sm text-white font-light">{opt.label}</div>
            {opt.sub && (
              <div className="text-[11px] text-[#9A9488] mt-0.5 font-light">
                {opt.sub}
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: string | boolean | number;
}) {
  const display =
    typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : value !== undefined && value !== null && value !== ""
        ? String(value)
        : "—";
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-2.5 px-4 border-b border-[rgba(198,165,90,0.06)] last:border-0">
      <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#9A9488] pt-0.5">
        {label}
      </span>
      <span className="text-sm text-[#E8DCC0] font-light break-words">
        {display}
      </span>
    </div>
  );
}

export function IntakeWizard({
  initialTier = "priority",
  prefill,
}: IntakeWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const titleCase = (s: string) =>
    s
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ");

  // Generate a natural description from prefill params for the NL box
  const initialNLMessage = (() => {
    if (!prefill) return "";
    const parts: string[] = [];
    if (prefill.country && prefill.document) {
      parts.push(`I need a ${prefill.document.replace(/-/g, " ")} for ${titleCase(prefill.country)}`);
    } else if (prefill.country) {
      parts.push(`I need document services for ${titleCase(prefill.country)}`);
    } else if (prefill.document) {
      parts.push(`I need a ${prefill.document.replace(/-/g, " ")}`);
    }
    if (prefill.matter) {
      parts.push(`related to ${prefill.matter.replace(/_/g, " ")}`);
    }
    if (prefill.useCase) {
      parts.push(`(${prefill.useCase.replace(/-/g, " ")})`);
    }
    return parts.join(" ");
  })();
  const [data, setData] = useState<IntakeData>({
    ...INITIAL_DATA,
    destination_country: prefill?.country
      ? titleCase(prefill.country)
      : INITIAL_DATA.destination_country,
    document_type: prefill?.document || INITIAL_DATA.document_type,
    notes:
      prefill?.useCase && !INITIAL_DATA.notes
        ? `Use case: ${prefill.useCase}`
        : INITIAL_DATA.notes,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof IntakeData | "consent", string>>
  >({});
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [usedLocation, setUsedLocation] = useState<"domestic" | "international" | "">(
    prefill?.country
      ? "international"
      : "",
  );
  const [apostilleChoice, setApostilleChoice] = useState<"yes" | "no" | "unsure" | "">("");
  const [translationChoice, setTranslationChoice] = useState<"yes" | "no" | "unsure" | "">("");
  const [analysisNote, setAnalysisNote] = useState<{
    msg: string;
    targetStep?: number;
  } | null>(null);
  const TOTAL = 3;

  const resolveCountry = (raw: string): string => {
    if (!raw) return "";
    const norm = raw.trim().toLowerCase();
    const hit = COUNTRIES.find((c) => c.toLowerCase() === norm);
    if (hit) return hit;
    if (norm === "us" || norm === "usa" || norm === "united states of america")
      return "United States";
    return "Other";
  };

  const resolveState = (raw: string): string => {
    if (!raw) return "";
    const norm = raw.trim().toLowerCase();
    return US_STATES.find((s) => s.toLowerCase() === norm) || "";
  };

  const set = <K extends keyof IntakeData>(field: K, value: IntakeData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const err = (field: keyof IntakeData | "consent", msg: string) => {
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const validate = (s: number): boolean => {
    const e: typeof errors = {};
    // Step 1 — Tell Us About Your Matter (client-facing essentials only)
    if (s === 1) {
      if (!data.client_name.trim()) e.client_name = "Full name is required";
      if (!data.email.trim() || !data.email.includes("@"))
        e.email = "Valid email is required";
      if (!data.document_type)
        e.document_type = "Please select what document you have";
      if (!data.document_description.trim())
        e.document_description = "A brief description is required";
    }
    // Step 2 — Execution Details (signer location required; rest optional/conditional)
    if (s === 2) {
      if (!data.origin_state) e.origin_state = "Please select where the signer is located";
    }
    // Step 3 — Review & Submit
    if (s === 3) {
      if (!consent) e.consent = "Please confirm you have read the notice above";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validate(step)) return;
    setStep((s) => Math.min(s + 1, TOTAL));
    setAnalysisNote(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    setAnalysisNote(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validate(3)) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      source_channel: "Website Form",
      name: data.client_name,
      client_name: data.client_name,
      email: data.email,
      phone: data.phone,
      organization: data.organization,
      is_attorney: data.is_attorney,
      document_type: data.document_type,
      document_description: data.document_description,
      docs: data.document_count,
      signers: data.signer_count,
      signer_names: data.signer_names,
      state: data.origin_state,
      country: data.destination_country || "United States",
      destination_country: data.destination_country,
      mobile: data.execution_type === "Mobile",
      // Apostille comes ONLY from explicit client intent — never fabricated from
      // a foreign destination. (foreign country ≠ apostille required.)
      apostille: data.apostille_required,
      apostille_count: data.apostille_count,
      translation: data.translation_needed,
      draft_ready: data.draft_ready,
      urgency:
        data.timeline.includes("Urgent") || data.timeline.includes("Same Day")
          ? "urgent"
          : "standard",
      deadline_date: data.deadline_date,
      weekend_holiday: data.weekend_holiday,
      source_detail: data.source_detail,
      attribution: data.attribution,
      notes: [
        data.notes,
        data.execution_type === "Mobile" && data.mobile_address.trim()
          ? `Mobile signing address: ${data.mobile_address.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join(" — "),
      matter_category: data.matter_category || undefined,
      ron_preferred: data.ron_preferred || undefined,
      wet_ink_required: data.wet_ink_required || undefined,
      receiving_authority: data.receiving_authority || undefined,
      deadline_or_closing_date: data.deadline_or_closing_date || undefined,
      courier_required: data.courier_required || undefined,
      name_match: true,
      files_uploaded: files.length > 0,
    };

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to submit");

      const dealId = json.deal?.id || json.deal_id;
      if (files.length > 0 && dealId) {
        const fd = new FormData();
        fd.append("deal_id", dealId);
        for (const f of files) fd.append("files", f);
        try{const upload=await fetch('/api/intake/upload',{method:'POST',body:fd});const receipt=await upload.json().catch(()=>null);json.upload_warning=!upload.ok||Boolean(receipt?.errors?.length)||receipt?.files?.length!==files.length;}catch{json.upload_warning=true;}
      }

      if (typeof sessionStorage !== "undefined") {
        if (json.payment_link)
          sessionStorage.setItem("ms_payment_link", json.payment_link);
        if (json.wise_invoice)
          sessionStorage.setItem(
            "ms_wise_invoice",
            JSON.stringify(json.wise_invoice),
          );
        sessionStorage.setItem("ms_intake_response", JSON.stringify(json));
      }

      router.push(
        `/intake/confirmation?id=${json.deal?.id || json.deal_id || ""}${json.upload_warning?'&upload_pending=1':''}`,
      );
    } catch (e) {
      setSubmitError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  const progressPct = ((step - 1) / (TOTAL - 1)) * 100;

  const handleAnalysisReady = (x: MatterAnalysis): void => {
    setData((prev) => {
      const merged: IntakeData = { ...prev };

      // Contact info — only fill if empty (user may have typed these manually)
      if (!prev.client_name && x.clientName) merged.client_name = x.clientName;
      if (!prev.email && x.email) merged.email = x.email;
      if (!prev.phone && x.phone) merged.phone = x.phone;
      if (!prev.organization && x.organization)
        merged.organization = x.organization;

      // Document fields — always overwrite so re-structuring the matter updates all fields
      if (x.documentType) merged.document_type = x.documentType;
      if (x.documentDescription)
        merged.document_description = x.documentDescription;
      if (x.documentCount > 1 || prev.document_count === 1)
        merged.document_count = Math.max(1, x.documentCount);
      if (x.signerCount > 1 || prev.signer_count === 1)
        merged.signer_count = Math.max(1, x.signerCount);
      if (x.signerNames) merged.signer_names = x.signerNames;

      const resolvedState = resolveState(x.originState);
      if (resolvedState) merged.origin_state = resolvedState;

      const resolvedCountry = resolveCountry(x.country);
      if (resolvedCountry) merged.destination_country = resolvedCountry;

      // Precedence: AI may FILL an unanswered field but must never silently
      // overturn an explicit client selection. apostilleChoice/translationChoice
      // are set only when the client has explicitly answered in Step 2.
      if (apostilleChoice === "") merged.apostille_required = x.apostilleRequired;
      if (translationChoice === "") merged.translation_needed = x.translationNeeded;

      if (x.urgency === "urgent") merged.timeline = "Urgent (24-48 hours)";
      else if (x.urgency === "expedited")
        merged.timeline = "Expedited (within a week)";
      else if (x.urgency === "standard" && prev.timeline === "")
        merged.timeline = "";

      return merged;
    });

    const filledDoc = !!(x.documentType || x.documentDescription || x.country);
    const filledContact = !!(x.clientName || x.email);
    if (filledDoc && filledContact) {
      setAnalysisNote({
        msg: "Matter structured — we filled in what we could below. Review and adjust.",
      });
    } else if (filledDoc) {
      setAnalysisNote({
        msg: "Document details filled in below. Review and adjust.",
      });
    } else if (filledContact) {
      setAnalysisNote({ msg: "Contact details filled in below." });
    }
  };

  const handleSmartFilesPicked = (picked: File[]): void => {
    if (!picked.length) return;
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name));
      return [...prev, ...picked.filter((f) => !seen.has(f.name))].slice(0, 10);
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-10 relative">
        <div className="absolute top-3.5 left-0 right-0 h-px bg-[rgba(198,165,90,0.12)]" />
        <motion.div
          className="absolute top-3.5 left-0 h-px bg-gradient-to-r from-[var(--ms-gold)] to-[#D4BB7A]"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
        <div className="relative flex justify-between">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{
                    borderColor:
                      done || active ? "var(--ms-gold)" : "rgba(198,165,90,0.2)",
                    backgroundColor: done || active ? "var(--ms-gold)" : "transparent",
                    boxShadow: active
                      ? "0 0 16px rgba(198,165,90,0.35)"
                      : "none",
                  }}
                  className="w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-semibold transition-colors"
                >
                  {done ? (
                    <Check className="w-3 h-3 text-[#0A0A0A]" strokeWidth={3} />
                  ) : (
                    <span
                      className={active ? "text-[#0A0A0A]" : "text-[#9A9488]"}
                    >
                      {n}
                    </span>
                  )}
                </motion.div>
                <span
                  className={`hidden sm:block text-[9px] tracking-[0.08em] uppercase font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "text-[var(--ms-gold)]"
                      : done
                        ? "text-[rgba(198,165,90,0.5)]"
                        : "text-[rgba(244,239,230,0.25)]"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="relative border border-[rgba(198,165,90,0.28)] rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(13,13,15,0.96) 0%, rgba(7,7,8,0.98) 100%)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(198,165,90,0.06), inset 0 0 30px rgba(198,165,90,0.02)",
        }}
      >
        {/* Gold top line */}
        <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[var(--ms-gold)] to-transparent opacity-60" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at top left, rgba(198,165,90,0.08), transparent 45%)" }} />

        <div className="px-8 py-10 md:px-12 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              {step === 1 && (
                <>
                  <h2 className="font-serif text-2xl text-[#E8DCC0] mb-1">
                    Tell Us About Your Matter
                  </h2>
                  <p className="text-[12px] text-[#9A9488] tracking-[0.04em] mb-1 font-light">
                    A few basics so we can review what you need. Takes about a minute.
                  </p>
                  <div className="w-10 h-px bg-[var(--ms-gold)] opacity-50 mb-8" />

                  {/* Optional AI helper — collapsed by default, never required */}
                  <div className="mb-7">
                    {!showAiHelper ? (
                      <button
                        type="button"
                        onClick={() => setShowAiHelper(true)}
                        className="text-[11px] text-[var(--ms-gold)]/85 underline underline-offset-2 hover:text-[#D4BB7A] transition-colors cursor-pointer"
                      >
                        Prefer to just describe it in your own words? Let us pre-fill for you →
                      </button>
                    ) : (
                      <>
                        <SmartMatterIntake
                          onAnalysisReady={handleAnalysisReady}
                          onFilesPicked={handleSmartFilesPicked}
                          initialMessage={initialNLMessage}
                        />
                        {analysisNote && (
                          <div className="flex items-center justify-between gap-3 mt-2 mb-2 px-4 py-3 bg-[rgba(198,165,90,0.08)] border border-[rgba(198,165,90,0.35)] rounded-sm">
                            <span className="text-[11px] text-[var(--ms-gold)] font-medium">
                              ✓ {analysisNote.msg}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAnalysisNote(null)}
                              className="text-[var(--ms-gold)] hover:text-[#9A9488] transition-colors cursor-pointer text-[12px] leading-none flex-shrink-0"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <FieldRow>
                    <FieldGroup>
                      <label className={labelCls}>
                        Full Name <span className="text-[var(--ms-gold)]">*</span>
                      </label>
                      <input
                        type="text"
                        value={data.client_name}
                        onChange={(e) => set("client_name", e.target.value)}
                        placeholder="First and last name"
                        className={inputCls}
                      />
                      {errors.client_name && (
                        <p className="text-[10.5px] text-red-300 mt-1">{errors.client_name}</p>
                      )}
                    </FieldGroup>
                    <FieldGroup>
                      <label className={labelCls}>
                        Email Address <span className="text-[var(--ms-gold)]">*</span>
                      </label>
                      <input
                        type="email"
                        value={data.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="your@email.com"
                        className={inputCls}
                      />
                      {errors.email && (
                        <p className="text-[10.5px] text-red-300 mt-1">{errors.email}</p>
                      )}
                    </FieldGroup>
                  </FieldRow>

                  <FieldGroup>
                    <label className={labelCls}>
                      Phone{" "}
                      <span className="text-[#9A9488] text-[9px] normal-case tracking-normal font-light">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={data.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+1 (000) 000-0000"
                      className={inputCls}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className={labelCls}>
                      What document do you have? <span className="text-[var(--ms-gold)]">*</span>
                    </label>
                    <select
                      value={data.document_type}
                      onChange={(e) => set("document_type", e.target.value)}
                      className={selectCls}
                    >
                      <option value="">— Select document type —</option>
                      <optgroup label="Personal &amp; Identity">
                        <option>Birth Certificate</option>
                        <option>Marriage Certificate</option>
                        <option>Divorce Decree</option>
                        <option>Death Certificate</option>
                        <option>Passport / Identification Copy</option>
                        <option>Name Change Document</option>
                      </optgroup>
                      <optgroup label="Legal &amp; Estate">
                        <option>Power of Attorney</option>
                        <option>Affidavit</option>
                        <option>Will / Testament</option>
                        <option>Trust Document</option>
                        <option>Court Order / Judgment</option>
                        <option>Release / Waiver</option>
                      </optgroup>
                      <optgroup label="Real Estate &amp; Financial">
                        <option>Deed / Title Document</option>
                        <option>Mortgage / Loan Document</option>
                        <option>Corporate Resolution</option>
                        <option>Articles of Incorporation</option>
                        <option>Contract / Agreement</option>
                      </optgroup>
                      <optgroup label="Immigration &amp; Background">
                        <option>FBI Background Check</option>
                        <option>Criminal Record / Police Report</option>
                        <option>Immigration Filing</option>
                        <option>Visa Support Document</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option>Academic Transcript / Diploma</option>
                        <option>Medical Record</option>
                        <option>Adoption Document</option>
                        <option>One and the Same Affidavit</option>
                        <option>Name Discrepancy Affidavit</option>
                        <option>Other — described below</option>
                      </optgroup>
                    </select>
                    {errors.document_type && (
                      <p className="text-[10.5px] text-red-300 mt-1">{errors.document_type}</p>
                    )}
                  </FieldGroup>

                  <FieldGroup>
                    <label className={labelCls}>
                      Where will it be used? <span className="text-[var(--ms-gold)]">*</span>
                    </label>
                    <RadioGroup
                      value={usedLocation}
                      onChange={(v) => {
                        const choice = v as "domestic" | "international";
                        setUsedLocation(choice);
                        if (choice === "domestic") set("destination_country", "United States");
                        else if (data.destination_country === "United States")
                          set("destination_country", "");
                      }}
                      options={[
                        { value: "domestic", label: "In the United States" },
                        { value: "international", label: "In another country", sub: "We'll ask which country next." },
                      ]}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className={labelCls}>
                      Briefly describe what you need{" "}
                      <span className="text-[var(--ms-gold)]">*</span>
                    </label>
                    <textarea
                      value={data.document_description}
                      onChange={(e) => set("document_description", e.target.value)}
                      placeholder="e.g. I need a power of attorney notarized for use in Italy."
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                    {errors.document_description && (
                      <p className="text-[10.5px] text-red-300 mt-1">{errors.document_description}</p>
                    )}
                  </FieldGroup>

                  <FieldGroup>
                    <label className={labelCls}>
                      Upload documents{" "}
                      <span className="text-[#9A9488] text-[9px] normal-case tracking-normal font-light">
                        (optional)
                      </span>
                    </label>
                    <FileUploadZone value={files} onChange={setFiles} maxFiles={5} maxSizeMB={10} />
                    <p className="text-[11px] text-[#9A9488] mt-2 font-light">
                      Uploading now lets us review in advance. All files are handled with strict confidentiality.
                    </p>
                  </FieldGroup>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="font-serif text-2xl text-[#E8DCC0] mb-1">
                    Execution Details
                  </h2>
                  <p className="text-[12px] text-[#9A9488] tracking-[0.04em] mb-1 font-light">
                    Just enough to route your matter correctly. Optional items stay hidden until relevant.
                  </p>
                  <div className="w-10 h-px bg-[var(--ms-gold)] opacity-50 mb-8" />

                  <FieldGroup>
                    <label className={labelCls}>
                      Where is the signer located? <span className="text-[var(--ms-gold)]">*</span>
                    </label>
                    <select
                      value={data.origin_state}
                      onChange={(e) => set("origin_state", e.target.value)}
                      className={selectCls}
                    >
                      <option value="">— Select state —</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.origin_state && (
                      <p className="text-[10.5px] text-red-300 mt-1">{errors.origin_state}</p>
                    )}
                  </FieldGroup>

                  <FieldGroup>
                    <label className={labelCls}>How should signing happen?</label>
                    <RadioGroup
                      value={data.execution_type}
                      onChange={(v) => set("execution_type", v as IntakeData["execution_type"])}
                      options={[
                        { value: "RON", label: "Remote (online notarization)", sub: "Sign by secure video from anywhere." },
                        { value: "Mobile", label: "Mobile (notary comes to you)" },
                        { value: "Unsure", label: "Not sure", sub: "We'll recommend the right path." },
                      ]}
                    />
                  </FieldGroup>

                  {data.execution_type === "Mobile" && (
                    <FieldGroup>
                      <label className={labelCls}>Signing address</label>
                      <input
                        type="text"
                        value={data.mobile_address}
                        onChange={(e) => set("mobile_address", e.target.value)}
                        placeholder="Street, city, state, ZIP"
                        className={inputCls}
                      />
                    </FieldGroup>
                  )}

                  {usedLocation === "international" && (
                    <FieldGroup>
                      <label className={labelCls}>Destination country</label>
                      <select
                        value={data.destination_country === "United States" ? "" : data.destination_country}
                        onChange={(e) => set("destination_country", e.target.value)}
                        className={selectCls}
                      >
                        <option value="">— Select country —</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </FieldGroup>
                  )}

                  <FieldRow>
                    <FieldGroup>
                      <label className={labelCls}>Number of documents</label>
                      <input
                        type="number"
                        min={1}
                        value={data.document_count}
                        onChange={(e) => set("document_count", Math.max(1, Number(e.target.value) || 1))}
                        className={inputCls}
                      />
                    </FieldGroup>
                    <FieldGroup>
                      <label className={labelCls}>Number of signers</label>
                      <input
                        type="number"
                        min={1}
                        value={data.signer_count}
                        onChange={(e) => set("signer_count", Math.max(1, Number(e.target.value) || 1))}
                        className={inputCls}
                      />
                    </FieldGroup>
                  </FieldRow>

                  {data.signer_count > 1 && (
                    <FieldGroup>
                      <label className={labelCls}>
                        Signer names{" "}
                        <span className="text-[#9A9488] text-[9px] normal-case tracking-normal font-light">
                          (one per line)
                        </span>
                      </label>
                      <textarea
                        value={data.signer_names}
                        onChange={(e) => set("signer_names", e.target.value)}
                        placeholder={"Jane Doe\nJohn Doe"}
                        rows={2}
                        className={`${inputCls} resize-none`}
                      />
                    </FieldGroup>
                  )}

                  <FieldGroup>
                    <label className={labelCls}>
                      Deadline{" "}
                      <span className="text-[#9A9488] text-[9px] normal-case tracking-normal font-light">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="date"
                      value={data.deadline_date}
                      onChange={(e) => set("deadline_date", e.target.value)}
                      className={inputCls}
                    />
                  </FieldGroup>

                  <FieldRow>
                    <FieldGroup>
                      <label className={labelCls}>Apostille needed?</label>
                      <RadioGroup
                        value={apostilleChoice}
                        onChange={(v) => {
                          const c = v as "yes" | "no" | "unsure";
                          setApostilleChoice(c);
                          set("apostille_required", c === "yes");
                        }}
                        options={[
                          { value: "yes", label: "Yes" },
                          { value: "no", label: "No" },
                          { value: "unsure", label: "Not sure" },
                        ]}
                      />
                      {apostilleChoice === "yes" && (
                        <div className="mt-3">
                          <label className={labelCls}>How many apostilles?</label>
                          <input
                            type="number"
                            min={1}
                            value={data.apostille_count}
                            onChange={(e) => set("apostille_count", Math.max(1, Number(e.target.value) || 1))}
                            className={inputCls}
                          />
                        </div>
                      )}
                    </FieldGroup>
                    <FieldGroup>
                      <label className={labelCls}>Translation needed?</label>
                      <RadioGroup
                        value={translationChoice}
                        onChange={(v) => {
                          const c = v as "yes" | "no" | "unsure";
                          setTranslationChoice(c);
                          set("translation_needed", c === "yes");
                        }}
                        options={[
                          { value: "yes", label: "Yes" },
                          { value: "no", label: "No" },
                          { value: "unsure", label: "Not sure" },
                        ]}
                      />
                    </FieldGroup>
                  </FieldRow>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="font-serif text-2xl text-[#E8DCC0] mb-1">
                    Review &amp; Submit
                  </h2>
                  <p className="text-[12px] text-[#9A9488] tracking-[0.04em] mb-1 font-light">
                    A quick check before you send. We review every matter before scheduling.
                  </p>
                  <div className="w-10 h-px bg-[var(--ms-gold)] opacity-50 mb-8" />

                  <div className="bg-[#0A0A0A] border border-[rgba(198,165,90,0.14)] rounded-sm mb-6">
                    <ReviewItem label="Name" value={data.client_name} />
                    <ReviewItem label="Email" value={data.email} />
                    {data.phone && <ReviewItem label="Phone" value={data.phone} />}
                    <ReviewItem label="Document" value={data.document_type} />
                    <ReviewItem
                      label="Used in"
                      value={usedLocation === "international" ? data.destination_country || "Another country" : "United States"}
                    />
                    <ReviewItem label="Description" value={data.document_description} />
                    <ReviewItem
                      label="Signing"
                      value={data.execution_type === "RON" ? "Remote" : data.execution_type === "Mobile" ? "Mobile" : "Not sure"}
                    />
                    {data.execution_type === "Mobile" && data.mobile_address && (
                      <ReviewItem label="Address" value={data.mobile_address} />
                    )}
                    <ReviewItem label="Signer where" value={data.origin_state} />
                    <ReviewItem label="Documents" value={data.document_count} />
                    <ReviewItem label="Signers" value={data.signer_count} />
                    {data.signer_count > 1 && data.signer_names && (
                      <ReviewItem label="Signer names" value={data.signer_names} />
                    )}
                    {data.deadline_date && <ReviewItem label="Deadline" value={data.deadline_date} />}
                    {apostilleChoice && (
                      <ReviewItem
                        label="Apostille"
                        value={apostilleChoice === "yes" ? `Yes (${data.apostille_count})` : apostilleChoice === "no" ? "No" : "Not sure"}
                      />
                    )}
                    {translationChoice && (
                      <ReviewItem
                        label="Translation"
                        value={translationChoice === "yes" ? "Yes" : translationChoice === "no" ? "No" : "Not sure"}
                      />
                    )}
                  </div>

                  {files.length > 0 && (
                    <div className="mb-6">
                      <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#9A9488] mb-2">
                        Uploaded files ({files.length})
                      </div>
                      <ul className="space-y-1">
                        {files.map((f) => (
                          <li key={f.name} className="text-[12px] text-[#E8DCC0] font-light truncate">
                            {f.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Canonical client pricing projection — no client-side math.
                      Amount + summary come only from projectClientPricing(). */}
                  {(() => {
                    const classification = classifyIntake({
                      structured: {
                        apostille: apostilleChoice === "yes" ? true : apostilleChoice === "no" ? false : undefined,
                        translation: translationChoice === "yes" ? true : translationChoice === "no" ? false : undefined,
                        destinationCountry: data.destination_country || undefined,
                        signerCount: data.signer_count,
                        documentType: data.document_type || undefined,
                        mobile: data.execution_type === "Mobile" ? true : undefined,
                      },
                    });
                    const result = priceSmartIntake({
                      classification,
                      selectedLane: initialTier,
                      commercialContext: "consumer",
                    });
                    const p = projectClientPricing(result);
                    return (
                      <div className="bg-[rgba(198,165,90,0.06)] border border-[rgba(198,165,90,0.28)] rounded-sm px-5 py-4 mb-6">
                        {p.mode === "approved_price" ? (
                          <>
                            <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--ms-gold)]/70 mb-1">Price</div>
                            <div className="text-2xl font-semibold text-white">
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(p.amount ?? 0)}
                            </div>
                            <div className="text-[12px] text-[#E8DCC0] font-light mt-1">{p.summary}</div>
                            <div className="text-[11px] text-[#9A9488] font-light mt-2">Payment is required before scheduling.</div>
                          </>
                        ) : (
                          <>
                            <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--ms-gold)]/70 mb-1">Quote Status</div>
                            <div className="text-lg font-semibold text-white">Ready for review</div>
                            <div className="text-[12px] text-[#9A9488] font-light mt-1">
                              We have enough information to begin. The Milano Seal will confirm your final execution route and quote.
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  <div className="bg-[rgba(15,26,36,0.04)] border border-[rgba(198,165,90,0.2)] border-l-[3px] border-l-[var(--ms-gold)] px-5 py-4 rounded-sm mb-6">
                    <p className="text-[12px] text-[#9A9488] leading-relaxed font-light">
                      All matters are reviewed by Nicholas Milano before execution is
                      scheduled. Submitting this form does not create a binding
                      engagement. You&apos;ll receive follow-up with next steps, scope
                      confirmation, and pricing within one business day.
                    </p>
                  </div>

                  <p className="text-[11px] text-[#9A9488] text-center mb-5 font-light">
                    No matter is scheduled or executed until scope is confirmed and payment is complete.
                  </p>

                  <div className="mb-2">
                    <CheckRow
                      checked={consent}
                      onChange={setConsent}
                      label="I understand that all matters are reviewed before execution is scheduled"
                    />
                    {errors.consent && (
                      <p className="text-[10.5px] text-red-300 mt-1">{errors.consent}</p>
                    )}
                  </div>

                  {submitError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[12px] text-red-300 mt-4 font-light"
                    >
                      {submitError}
                    </motion.p>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-4 mt-9 pt-7 border-t border-[rgba(26,18,8,0.07)]">
            {step > 1 && (
              <button
                onClick={goBack}
                className="flex items-center cursor-pointer gap-2 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#9A9488] hover:text-[#9A9488] transition-colors duration-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <div className="ml-auto">
              {step < TOTAL ? (
                <button
                  onClick={goNext}
                  className="group flex items-center cursor-pointer gap-2.5 px-9 py-3.5 bg-[var(--ms-gold)] hover:bg-[#D4BB7A] text-[#0F1A24] text-[10px] font-semibold tracking-[0.2em] uppercase rounded-sm transition-all duration-200 hover:shadow-[0_6px_24px_rgba(198,165,90,0.3)] hover:-translate-y-px"
                >
                  Continue
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="group flex items-center cursor-pointer gap-2.5 px-10 py-3.5 bg-[var(--ms-gold)] hover:bg-[#D4BB7A] disabled:opacity-50 disabled:cursor-not-allowed text-[#0F1A24] text-[10px] font-semibold tracking-[0.2em] uppercase rounded-sm transition-all duration-200 hover:shadow-[0_6px_24px_rgba(198,165,90,0.3)] hover:-translate-y-px"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                      Submitting…
                    </>
                  ) : (
                    <>
                      Submit Request{" "}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] tracking-[0.08em] uppercase text-[rgba(198,165,90,0.4)] mt-7">
        Florida Notary Public &nbsp;·&nbsp; Remote Online Notary &nbsp;·&nbsp; Hague Route Reviewed
      </p>
    </div>
  );
}
