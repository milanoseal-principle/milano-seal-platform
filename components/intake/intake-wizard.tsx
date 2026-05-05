"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, Check, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface IntakeData {
  // Step 1 — Contact
  client_name: string;
  email: string;
  phone: string;
  organization: string;
  is_attorney: boolean;
  // Step 2 — Document
  document_type: string;
  document_description: string;
  document_count: number;
  signer_count: number;
  signer_names: string;
  origin_state: string;
  destination_country: string;
  execution_type: "RON" | "Mobile" | "Unsure";
  // Step 3 — Services
  apostille_required: boolean;
  apostille_count: number;
  translation_needed: boolean;
  draft_ready: boolean;
  timeline: string;
  deadline_date: string;
  weekend_holiday: boolean;
  // Step 4 — Attribution
  source_detail: string;
  attribution: string;
  notes: string;
}

interface IntakePrefill {
  country?: string;
  document?: string;
  useCase?: string;
}

interface IntakeWizardProps {
  initialTier?: "signature" | "priority" | "executive";
  prefill?: IntakePrefill;
}

// ── DATA ──────────────────────────────────────────────────────────────────────
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

const STEP_LABELS = ["Contact", "Document", "Services", "Details", "Review"];

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
};

// ── SHARED STYLE PRIMITIVES ───────────────────────────────────────────────────
const inputCls = `w-full px-4 py-3 bg-[#0A0A0A] border border-[rgba(198,165,90,0.15)]
  rounded-sm text-white text-sm font-light placeholder:text-[#B0B0B0]/40
  focus:outline-none focus:border-[#C6A55A] transition-colors duration-200`;

const selectCls = `${inputCls} appearance-none cursor-pointer`;

const labelCls = `block text-[10px] font-semibold tracking-[0.14em] uppercase text-[#8A7A60] mb-2`;

const checkRowCls = `flex items-start gap-3 p-3.5 bg-[#0A0A0A] border border-[rgba(198,165,90,0.12)]
  rounded-sm cursor-pointer transition-all duration-200 hover:border-[rgba(198,165,90,0.3)]`;

// ── COMPONENT ATOMS ───────────────────────────────────────────────────────────
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
      <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#C6A55A]/60">
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
            ? "bg-[#C6A55A] border-[#C6A55A]"
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
          <div className="text-[11px] text-[#8A7A60] mt-0.5 font-light">
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
          } ${
            value === opt.value ? "bg-[rgba(198,165,90,0.06)]" : ""
          }`}
        >
          <div
            className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150 ${
              value === opt.value
                ? "border-[#C6A55A]"
                : "border-[rgba(198,165,90,0.3)]"
            }`}
          >
            {value === opt.value && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A55A]" />
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
              <div className="text-[11px] text-[#8A7A60] mt-0.5 font-light">
                {opt.sub}
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

// ── REVIEW ITEM ───────────────────────────────────────────────────────────────
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
      <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#8A7A60] pt-0.5">
        {label}
      </span>
      <span className="text-sm text-[#1A1208] font-light break-words">
        {display}
      </span>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function IntakeWizard({
  initialTier = "priority",
  prefill,
}: IntakeWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  // Title-case helper so "italy" from /map?country=italy becomes "Italy"
  const titleCase = (s: string) =>
    s
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ");
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
  const fileRef = useRef<HTMLInputElement>(null);
  const TOTAL = 5;

  const set = <K extends keyof IntakeData>(field: K, value: IntakeData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const err = (field: keyof IntakeData | "consent", msg: string) => {
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const validate = (s: number): boolean => {
    const e: typeof errors = {};
    if (s === 1) {
      if (!data.client_name.trim()) e.client_name = "Full name is required";
      if (!data.email.trim() || !data.email.includes("@"))
        e.email = "Valid email is required";
    }
    if (s === 2) {
      if (!data.document_type)
        e.document_type = "Please select a document type";
      if (!data.document_description.trim())
        e.document_description = "A brief description is required";
      if (!data.origin_state) e.origin_state = "Origin state is required";
    }
    if (s === 5) {
      if (!consent) e.consent = "Please confirm you have read the notice above";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validate(step)) return;
    setStep((s) => Math.min(s + 1, TOTAL));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validate(5)) return;
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
      apostille:
        data.apostille_required ||
        (data.destination_country !== "" &&
          data.destination_country !== "United States"),
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
      notes: data.notes,
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

      if (typeof sessionStorage !== "undefined") {
        if (json.payment_link)
          sessionStorage.setItem("ms_payment_link", json.payment_link);
        if (json.wise_invoice)
          sessionStorage.setItem(
            "ms_wise_invoice",
            JSON.stringify(json.wise_invoice)
          );
        sessionStorage.setItem("ms_intake_response", JSON.stringify(json));
      }

      router.push(
        `/intake/confirmation?id=${json.deal?.id || json.deal_id || ""}`
      );
    } catch (e) {
      setSubmitError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  // Progress line width
  const progressPct = ((step - 1) / (TOTAL - 1)) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* ── PROGRESS BAR ─────────────────────────────────────── */}
      <div className="mb-10 relative">
        {/* Track */}
        <div className="absolute top-3.5 left-0 right-0 h-px bg-[rgba(198,165,90,0.12)]" />
        {/* Fill */}
        <motion.div
          className="absolute top-3.5 left-0 h-px bg-gradient-to-r from-[#C6A55A] to-[#D4BB7A]"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
        {/* Nodes */}
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
                      done || active ? "#C6A55A" : "rgba(198,165,90,0.2)",
                    backgroundColor:
                      done || active ? "#C6A55A" : "transparent",
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
                      className={active ? "text-[#0A0A0A]" : "text-[#8A7A60]"}
                    >
                      {n}
                    </span>
                  )}
                </motion.div>
                <span
                  className={`hidden sm:block text-[9px] tracking-[0.08em] uppercase font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "text-[#C6A55A]"
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

      {/* ── CARD ─────────────────────────────────────────────── */}
      <div className="relative bg-[#F4EFE6] border border-[rgba(198,165,90,0.18)] rounded-sm shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        {/* Gold top line */}
        <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#C6A55A] to-transparent opacity-40" />

        <div className="px-8 py-10 md:px-12 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* ── STEP 1: CONTACT ──────────────────────────── */}
              {step === 1 && (
                <>
                  <h2 className="font-serif text-2xl text-[#1A1208] mb-1">
                    Contact Information
                  </h2>
                  <p className="text-[12px] text-[#8A7A60] tracking-[0.04em] mb-1 font-light">
                    Your primary details for this matter.
                  </p>
                  <div className="w-10 h-px bg-[#C6A55A] opacity-50 mb-8" />

                  <FieldRow>
                    <FieldGroup>
                      <label className={labelCls}>
                        Full Name <span className="text-[#8A7240]">*</span>
                      </label>
                      <input
                        type="text"
                        value={data.client_name}
                        onChange={(e) => set("client_name", e.target.value)}
                        placeholder="First and last name"
                        className={inputCls}
                      />
                      {errors.client_name && (
                        <p className="text-[10.5px] text-red-800 mt-1">
                          {errors.client_name}
                        </p>
                      )}
                    </FieldGroup>
                    <FieldGroup>
                      <label className={labelCls}>
                        Email Address <span className="text-[#8A7240]">*</span>
                      </label>
                      <input
                        type="email"
                        value={data.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="your@email.com"
                        className={inputCls}
                      />
                      {errors.email && (
                        <p className="text-[10.5px] text-red-800 mt-1">
                          {errors.email}
                        </p>
                      )}
                    </FieldGroup>
                  </FieldRow>
                  <FieldRow>
                    <FieldGroup>
                      <label className={labelCls}>
                        Phone{" "}
                        <span className="text-[#8A7A60] text-[9px] normal-case tracking-normal font-light">
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
                        Organization / Firm{" "}
                        <span className="text-[#8A7A60] text-[9px] normal-case tracking-normal font-light">
                          (if applicable)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={data.organization}
                        onChange={(e) => set("organization", e.target.value)}
                        placeholder="Law firm or company"
                        className={inputCls}
                      />
                    </FieldGroup>
                  </FieldRow>
                  <FieldGroup>
                    <CheckRow
                      checked={data.is_attorney}
                      onChange={(v) => set("is_attorney", v)}
                      label="I am an attorney or legal professional"
                      sub="Enables law firm referral pricing and professional coordination lane"
                    />
                  </FieldGroup>
                </>
              )}

              {/* ── STEP 2: DOCUMENT ─────────────────────────── */}
              {step === 2 && (
                <>
                  <h2 className="font-serif text-2xl text-[#1A1208] mb-1">
                    Document Details
                  </h2>
                  <p className="text-[12px] text-[#8A7A60] tracking-[0.04em] mb-1 font-light">
                    Tell us about the document or matter to be coordinated.
                  </p>
                  <div className="w-10 h-px bg-[#C6A55A] opacity-50 mb-8" />

                  <FieldGroup>
                    <label className={labelCls}>
                      Document Type <span className="text-[#8A7240]">*</span>
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
                      <p className="text-[10.5px] text-red-800 mt-1">
                        {errors.document_type}
                      </p>
                    )}
                  </FieldGroup>

                  <FieldGroup>
                    <label className={labelCls}>
                      Document Description{" "}
                      <span className="text-[#8A7240]">*</span>
                    </label>
                    <textarea
                      value={data.document_description}
                      onChange={(e) =>
                        set("document_description", e.target.value)
                      }
                      placeholder="Briefly describe the document(s) and how they will be used. Include any international context."
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                    {errors.document_description && (
                      <p className="text-[10.5px] text-red-800 mt-1">
                        {errors.document_description}
                      </p>
                    )}
                  </FieldGroup>

                  <FieldRow>
                    <FieldGroup>
                      <label className={labelCls}>Number of Documents</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={data.document_count}
                        onChange={(e) =>
                          set("document_count", parseInt(e.target.value) || 1)
                        }
                        className={inputCls}
                      />
                    </FieldGroup>
                    <FieldGroup>
                      <label className={labelCls}>Number of Signers</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={data.signer_count}
                        onChange={(e) =>
                          set("signer_count", parseInt(e.target.value) || 1)
                        }
                        className={inputCls}
                      />
                    </FieldGroup>
                  </FieldRow>

                  <FieldRow>
                    <FieldGroup>
                      <label className={labelCls}>
                        Origin State <span className="text-[#8A7240]">*</span>
                      </label>
                      <select
                        value={data.origin_state}
                        onChange={(e) => set("origin_state", e.target.value)}
                        className={selectCls}
                      >
                        <option value="">— State —</option>
                        {US_STATES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      {errors.origin_state && (
                        <p className="text-[10.5px] text-red-800 mt-1">
                          {errors.origin_state}
                        </p>
                      )}
                    </FieldGroup>
                    <FieldGroup>
                      <label className={labelCls}>Destination Country</label>
                      <input
                        list="countries-list"
                        value={data.destination_country}
                        onChange={(e) =>
                          set("destination_country", e.target.value)
                        }
                        placeholder="Italy, Germany, Mexico…"
                        className={inputCls}
                      />
                      <datalist id="countries-list">
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </FieldGroup>
                  </FieldRow>

                  <FieldGroup>
                    <label className={labelCls}>
                      Preferred Execution Method
                    </label>
                    <RadioGroup
                      value={data.execution_type}
                      onChange={(v) =>
                        set("execution_type", v as IntakeData["execution_type"])
                      }
                      options={[
                        {
                          value: "RON",
                          label: "Remote Online Notarization (RON)",
                          sub: "Video session from any location",
                        },
                        {
                          value: "Mobile",
                          label: "Mobile / In-Person",
                          sub: "Notary travels to the signer",
                        },
                        {
                          value: "Unsure",
                          label: "Unsure — I would like guidance",
                          sub: "We will recommend the correct method for your matter",
                        },
                      ]}
                    />
                  </FieldGroup>
                </>
              )}

              {/* ── STEP 3: SERVICES ─────────────────────────── */}
              {step === 3 && (
                <>
                  <h2 className="font-serif text-2xl text-[#1A1208] mb-1">
                    Services Required
                  </h2>
                  <p className="text-[12px] text-[#8A7A60] tracking-[0.04em] mb-1 font-light">
                    Indicate which services are needed for this matter.
                  </p>
                  <div className="w-10 h-px bg-[#C6A55A] opacity-50 mb-8" />

                  <SectionLabel>Authentication &amp; Translation</SectionLabel>

                  <FieldGroup>
                    <CheckRow
                      checked={data.apostille_required}
                      onChange={(v) => set("apostille_required", v)}
                      label="Apostille Required"
                      sub="Document must be authenticated for use in a Hague Convention country"
                    />
                    <AnimatePresence>
                      {data.apostille_required && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <label className={labelCls}>
                            Number of Apostilles Needed
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={data.apostille_count}
                            onChange={(e) =>
                              set(
                                "apostille_count",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className={`${inputCls} max-w-[140px]`}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </FieldGroup>

                  <FieldGroup>
                    <CheckRow
                      checked={data.translation_needed}
                      onChange={(v) => set("translation_needed", v)}
                      label="Translation Required"
                      sub="Document needs certified translation before or after notarization"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <CheckRow
                      checked={data.draft_ready}
                      onChange={(v) => set("draft_ready", v)}
                      label="Document is Draft-Ready"
                      sub="A finalized draft is prepared and ready for execution"
                    />
                  </FieldGroup>

                  <SectionLabel>Timeline &amp; Scheduling</SectionLabel>

                  <FieldRow>
                    <FieldGroup>
                      <label className={labelCls}>Timeline</label>
                      <select
                        value={data.timeline}
                        onChange={(e) => set("timeline", e.target.value)}
                        className={selectCls}
                      >
                        <option value="">— Select —</option>
                        <option>Standard (5–10 business days)</option>
                        <option>Expedited (2–4 business days)</option>
                        <option>Urgent (24–48 hours)</option>
                        <option>Same Day — subject to availability</option>
                      </select>
                    </FieldGroup>
                    <FieldGroup>
                      <label className={labelCls}>
                        Deadline Date{" "}
                        <span className="text-[#8A7A60] text-[9px] normal-case tracking-normal font-light">
                          (if applicable)
                        </span>
                      </label>
                      <input
                        type="date"
                        value={data.deadline_date}
                        onChange={(e) => set("deadline_date", e.target.value)}
                        className={inputCls}
                      />
                    </FieldGroup>
                  </FieldRow>

                  <FieldGroup>
                    <CheckRow
                      checked={data.weekend_holiday}
                      onChange={(v) => set("weekend_holiday", v)}
                      label="Weekend or Holiday Execution Required"
                      sub="Rush scheduling outside standard business hours — additional coordination fees may apply"
                    />
                  </FieldGroup>
                </>
              )}

              {/* ── STEP 4: ADDITIONAL DETAILS ───────────────── */}
              {step === 4 && (
                <>
                  <h2 className="font-serif text-2xl text-[#1A1208] mb-1">
                    Additional Details
                  </h2>
                  <p className="text-[12px] text-[#8A7A60] tracking-[0.04em] mb-1 font-light">
                    Upload documents and let us know how you found us.
                  </p>
                  <div className="w-10 h-px bg-[#C6A55A] opacity-50 mb-8" />

                  <FieldGroup>
                    <label className={labelCls}>
                      How did you hear about The Milano Seal?
                    </label>
                    <select
                      value={data.source_detail}
                      onChange={(e) => {
                        set("source_detail", e.target.value);
                        if (
                          ![
                            "Attorney / Law Firm Referral",
                            "Existing Client",
                            "Personal Referral",
                          ].includes(e.target.value)
                        )
                          set("attribution", "");
                      }}
                      className={selectCls}
                    >
                      <option value="">— Select —</option>
                      <option>Attorney / Law Firm Referral</option>
                      <option>Existing Client</option>
                      <option>Google Search</option>
                      <option>Social Media</option>
                      <option>Direct Outreach</option>
                      <option>Personal Referral</option>
                      <option>Other</option>
                    </select>
                  </FieldGroup>

                  <AnimatePresence>
                    {[
                      "Attorney / Law Firm Referral",
                      "Existing Client",
                      "Personal Referral",
                    ].includes(data.source_detail) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-5"
                      >
                        <label className={labelCls}>
                          If referred, who may we thank?
                        </label>
                        <input
                          type="text"
                          value={data.attribution}
                          onChange={(e) => set("attribution", e.target.value)}
                          placeholder="Name or organization"
                          className={inputCls}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <FieldGroup>
                    <label className={labelCls}>
                      Upload Documents{" "}
                      <span className="text-[#8A7A60] text-[9px] normal-case tracking-normal font-light">
                        (optional — for advance review)
                      </span>
                    </label>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files)
                          setFiles(Array.from(e.target.files));
                      }}
                    />
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border border-dashed border-[rgba(198,165,90,0.3)] bg-[rgba(198,165,90,0.03)] rounded-sm px-6 py-7 text-center cursor-pointer hover:border-[#C6A55A] hover:bg-[rgba(198,165,90,0.06)] transition-all duration-200"
                    >
                      <Upload className="w-5 h-5 text-[#8A7240] mx-auto mb-2" />
                      <p className="text-[12px] text-[#4A4030]">
                        Drop files here or click to browse
                      </p>
                      <p className="text-[10.5px] text-[#8A7A60] mt-1">
                        PDF, DOC, JPG accepted · Up to 10 files
                      </p>
                    </div>
                    {files.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {files.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-3 py-2 bg-[rgba(198,165,90,0.06)] border border-[rgba(198,165,90,0.15)] rounded-sm"
                          >
                            <span className="text-[12px] text-[#4A4030] truncate">
                              {f.name}
                            </span>
                            <button
                              onClick={() =>
                                setFiles((prev) =>
                                  prev.filter((_, j) => j !== i)
                                )
                              }
                              className="ml-2 text-[#8A7A60] hover:text-[#4A4030] flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-[#8A7A60] mt-2 font-light">
                      Uploading documents now allows for advance review prior to
                      scheduling. All files are handled with strict
                      confidentiality.
                    </p>
                  </FieldGroup>

                  <FieldGroup>
                    <label className={labelCls}>
                      Signer Names{" "}
                      <span className="text-[#8A7A60] text-[9px] normal-case tracking-normal font-light">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={data.signer_names}
                      onChange={(e) => set("signer_names", e.target.value)}
                      placeholder="List the full name(s) and city/state of each signer, one per line."
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className={labelCls}>
                      Additional Notes{" "}
                      <span className="text-[#8A7A60] text-[9px] normal-case tracking-normal font-light">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={data.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      placeholder="Any specific requirements, context, or questions."
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </FieldGroup>
                </>
              )}

              {/* ── STEP 5: REVIEW & SUBMIT ──────────────────── */}
              {step === 5 && (
                <>
                  <h2 className="font-serif text-2xl text-[#1A1208] mb-1">
                    Review &amp; Submit
                  </h2>
                  <p className="text-[12px] text-[#8A7A60] tracking-[0.04em] mb-1 font-light">
                    Confirm your matter details before sending.
                  </p>
                  <div className="w-10 h-px bg-[#C6A55A] opacity-50 mb-8" />

                  {/* Matter summary */}
                  <div className="bg-[rgba(255,255,255,0.5)] border border-[rgba(26,18,8,0.08)] rounded-sm overflow-hidden mb-5">
                    <div className="px-4 py-2.5 bg-[rgba(198,165,90,0.08)] border-b border-[rgba(198,165,90,0.1)]">
                      <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#8A7240]">
                        Contact
                      </span>
                    </div>
                    <ReviewItem label="Name" value={data.client_name} />
                    <ReviewItem label="Email" value={data.email} />
                    {data.phone && (
                      <ReviewItem label="Phone" value={data.phone} />
                    )}
                    {data.organization && (
                      <ReviewItem
                        label="Organization"
                        value={data.organization}
                      />
                    )}
                    <ReviewItem
                      label="Attorney / Firm"
                      value={data.is_attorney}
                    />
                    <div className="px-4 py-2.5 bg-[rgba(198,165,90,0.08)] border-b border-[rgba(198,165,90,0.1)] border-t border-t-[rgba(198,165,90,0.06)]">
                      <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#8A7240]">
                        Document
                      </span>
                    </div>
                    <ReviewItem
                      label="Document Type"
                      value={data.document_type}
                    />
                    <ReviewItem
                      label="Description"
                      value={data.document_description}
                    />
                    <ReviewItem label="Documents" value={data.document_count} />
                    <ReviewItem label="Signers" value={data.signer_count} />
                    {data.signer_names && (
                      <ReviewItem
                        label="Signer Names"
                        value={data.signer_names}
                      />
                    )}
                    <ReviewItem
                      label="Origin State"
                      value={data.origin_state}
                    />
                    {data.destination_country && (
                      <ReviewItem
                        label="Destination Country"
                        value={data.destination_country}
                      />
                    )}
                    <ReviewItem
                      label="Execution Method"
                      value={data.execution_type}
                    />
                    <div className="px-4 py-2.5 bg-[rgba(198,165,90,0.08)] border-b border-[rgba(198,165,90,0.1)] border-t border-t-[rgba(198,165,90,0.06)]">
                      <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#8A7240]">
                        Services
                      </span>
                    </div>
                    <ReviewItem
                      label="Apostille"
                      value={
                        data.apostille_required
                          ? `Yes — ${data.apostille_count} document${
                              data.apostille_count > 1 ? "s" : ""
                            }`
                          : "Not required"
                      }
                    />
                    <ReviewItem
                      label="Translation"
                      value={data.translation_needed}
                    />
                    <ReviewItem label="Draft Ready" value={data.draft_ready} />
                    {data.timeline && (
                      <ReviewItem label="Timeline" value={data.timeline} />
                    )}
                    {data.deadline_date && (
                      <ReviewItem label="Deadline" value={data.deadline_date} />
                    )}
                    <ReviewItem
                      label="Weekend / Holiday"
                      value={data.weekend_holiday}
                    />
                    {(data.source_detail ||
                      data.attribution ||
                      data.notes) && (
                      <>
                        <div className="px-4 py-2.5 bg-[rgba(198,165,90,0.08)] border-b border-[rgba(198,165,90,0.1)] border-t border-t-[rgba(198,165,90,0.06)]">
                          <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#8A7240]">
                            Details
                          </span>
                        </div>
                        {data.source_detail && (
                          <ReviewItem
                            label="Source"
                            value={data.source_detail}
                          />
                        )}
                        {data.attribution && (
                          <ReviewItem
                            label="Attribution"
                            value={data.attribution}
                          />
                        )}
                        {data.notes && (
                          <ReviewItem label="Notes" value={data.notes} />
                        )}
                      </>
                    )}
                  </div>

                  {/* Pricing estimate block */}
                  {(() => {
                    const isIntl =
                      data.destination_country &&
                      data.destination_country !== "United States";
                    const isUrgent =
                      data.timeline?.includes("Urgent") ||
                      data.timeline?.includes("Same Day");
                    const isExpedited = data.timeline?.includes("Expedited");
                    const baseLane =
                      isIntl && data.apostille_required
                        ? "Priority"
                        : "Signature";
                    const basePrice = baseLane === "Priority" ? 975 : 750;
                    const items: { label: string; price: number }[] = [
                      {
                        label: `${baseLane} Lane — ${
                          data.document_type || "Document execution"
                        }`,
                        price: basePrice,
                      },
                    ];
                    if (data.document_count > 1)
                      items.push({
                        label: `Additional documents (${
                          data.document_count - 1
                        } × $75)`,
                        price: (data.document_count - 1) * 75,
                      });
                    if (data.signer_count > 1)
                      items.push({
                        label: `Additional signers (${
                          data.signer_count - 1
                        } × $150)`,
                        price: (data.signer_count - 1) * 150,
                      });
                    if (data.apostille_required)
                      items.push({
                        label: `Apostille coordination (${data.apostille_count} × $250)`,
                        price: data.apostille_count * 250,
                      });
                    if (data.translation_needed)
                      items.push({
                        label: "Translation coordination",
                        price: 150,
                      });
                    if (isUrgent)
                      items.push({ label: "Urgent timeline", price: 400 });
                    else if (isExpedited)
                      items.push({ label: "Expedited timeline", price: 200 });
                    if (data.weekend_holiday)
                      items.push({
                        label: "Weekend / Holiday execution",
                        price: 200,
                      });
                    const total = items.reduce((s, i) => s + i.price, 0);
                    const retainer = Math.round(total * 0.5);
                    return (
                      <div className="bg-[rgba(10,10,10,0.03)] border border-[rgba(198,165,90,0.2)] border-l-[3px] border-l-[#C6A55A] rounded-sm mb-5">
                        <div className="px-4 py-2.5 border-b border-[rgba(198,165,90,0.1)]">
                          <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#8A7240]">
                            Estimated Investment
                          </span>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          {items.map((item, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center"
                            >
                              <span className="text-[12px] text-[#4A4030] font-light">
                                {item.label}
                              </span>
                              <span className="text-[12px] text-[#4A4030] font-medium">
                                ${item.price.toLocaleString()}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-[rgba(198,165,90,0.15)] pt-2 mt-2 flex justify-between items-center">
                            <span className="text-[12px] font-semibold text-[#1A1208]">
                              Estimated Total
                            </span>
                            <span className="text-[14px] font-semibold text-[#1A1208]">
                              ${total.toLocaleString()}+
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-[#8A7A60]">
                              Retainer due at confirmation (50%)
                            </span>
                            <span className="text-[12px] text-[#8A7240] font-medium">
                              ${retainer.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="px-4 py-2.5 border-t border-[rgba(198,165,90,0.08)]">
                          <p className="text-[10px] text-[#8A7A60] italic">
                            Final scope and pricing confirmed by Nicholas Milano
                            after matter review. This is an estimate based on
                            the information provided.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Consent box */}
                  <div className="bg-[rgba(15,26,36,0.04)] border border-[rgba(198,165,90,0.2)] border-l-[3px] border-l-[#C6A55A] px-5 py-4 rounded-sm mb-6">
                    <p className="text-[12px] text-[#4A4030] leading-relaxed font-light">
                      All matters are reviewed by Nicholas Milano before
                      execution is scheduled. Submission of this form does not
                      create a legally binding engagement. You will receive a
                      follow-up with next steps, scope confirmation, and pricing
                      within one business day.
                    </p>
                  </div>

                  <div className="mb-2">
                    <CheckRow
                      checked={consent}
                      onChange={setConsent}
                      label="I understand that all matters are reviewed before execution is scheduled"
                    />
                    {errors.consent && (
                      <p className="text-[10.5px] text-red-800 mt-1">
                        {errors.consent}
                      </p>
                    )}
                  </div>

                  {submitError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[12px] text-red-800 mt-4 font-light"
                    >
                      {submitError}
                    </motion.p>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── NAV BUTTONS ──────────────────────────────────── */}
          <div className="flex items-center gap-4 mt-9 pt-7 border-t border-[rgba(26,18,8,0.07)]">
            {step > 1 && (
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#8A7A60] hover:text-[#4A4030] transition-colors duration-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <div className="ml-auto">
              {step < TOTAL ? (
                <button
                  onClick={goNext}
                  className="group flex items-center gap-2.5 px-9 py-3.5 bg-[#C6A55A] hover:bg-[#D4BB7A] text-[#0F1A24] text-[10px] font-semibold tracking-[0.2em] uppercase rounded-sm transition-all duration-200 hover:shadow-[0_6px_24px_rgba(198,165,90,0.3)] hover:-translate-y-px"
                >
                  Continue
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="group flex items-center gap-2.5 px-10 py-3.5 bg-[#C6A55A] hover:bg-[#D4BB7A] disabled:opacity-50 disabled:cursor-not-allowed text-[#0F1A24] text-[10px] font-semibold tracking-[0.2em] uppercase rounded-sm transition-all duration-200 hover:shadow-[0_6px_24px_rgba(198,165,90,0.3)] hover:-translate-y-px"
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

      {/* Trust footer */}
      <p className="text-center text-[10px] tracking-[0.08em] uppercase text-[rgba(198,165,90,0.4)] mt-7">
        Florida Notary Public &nbsp;·&nbsp; RON Certified &nbsp;·&nbsp; Hague
        Convention Compliant
      </p>
    </div>
  );
}
