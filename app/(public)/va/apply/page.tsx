"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { MILANO_PUBLIC_PROMISE } from "@/data/milano-revenue-copy-system";

const labelClass = "block text-sm font-medium text-white/90 mb-1.5";
const inputClass =
  "w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-[#8A8A8A]/70 outline-none focus:border-[#C6A55A]/60";

export default function Page() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    timezone: "",
    experience: "",
    document_admin_experience: "",
    language_skills: "",
    availability: "",
    reason: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/sales/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          audience: "virtual_assistant",
          desired_next_step: "va_application",
          source_route: "/va/apply",
        }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <section
        className="px-4 sm:px-6 pb-16"
        style={{
          paddingTop: "calc(var(--header-total-height) + var(--sa-top) + 1.5rem)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <h1
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#C6A55A" }}
          >
            Apply to Execution Support Network
          </h1>

          <p className="mt-5 text-[#8A8A8A] leading-relaxed max-w-3xl">
            Support controlled international document execution operations.
          </p>

          <p className="mt-4 text-[#8A8A8A] leading-relaxed max-w-3xl">
            Execution support specialists assist The Milano Seal™ with intake
            review, upload organization, document checklist support,
            missing-field identification, and escalation of incomplete matters
            to authorized operators. Support roles do not provide legal advice,
            notarial acts, apostille determinations, payment approval,
            client-facing authority, or final release approval.
          </p>

          <p className="mt-4 text-[#8A8A8A] leading-relaxed max-w-3xl">
            {MILANO_PUBLIC_PROMISE}
          </p>

          {status === "success" ? (
            <div className="mt-10 rounded-lg border border-[#C6A55A]/30 bg-[#C6A55A]/[0.05] p-6">
              <h2
                className="text-xl font-semibold"
                style={{
                  fontFamily: "var(--font-serif, serif)",
                  color: "#C6A55A",
                }}
              >
                Application received
              </h2>
              <p className="mt-3 text-sm text-[#8A8A8A] leading-relaxed">
                Thank you for applying to support the Milano Seal execution
                queue. Your details have been captured and will be reviewed.
              </p>
              <div className="mt-5">
                <Link
                  href="/intake"
                  className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-[#0A0A0A] transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#C6A55A" }}
                >
                  Begin Secure Intake
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <label className={labelClass} htmlFor="full_name">
                  Name
                </label>
                <input
                  id="full_name"
                  className={inputClass}
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="timezone">
                  Timezone
                </label>
                <input
                  id="timezone"
                  className={inputClass}
                  value={form.timezone}
                  onChange={(e) => update("timezone", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="experience">
                  Experience
                </label>
                <input
                  id="experience"
                  className={inputClass}
                  value={form.experience}
                  onChange={(e) => update("experience", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="document_admin_experience">
                  Document / admin experience
                </label>
                <input
                  id="document_admin_experience"
                  className={inputClass}
                  value={form.document_admin_experience}
                  onChange={(e) =>
                    update("document_admin_experience", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="language_skills">
                  Language skills
                </label>
                <input
                  id="language_skills"
                  className={inputClass}
                  value={form.language_skills}
                  onChange={(e) => update("language_skills", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="availability">
                  Availability
                </label>
                <input
                  id="availability"
                  className={inputClass}
                  placeholder="e.g. Hours per week, time zone overlap"
                  value={form.availability}
                  onChange={(e) => update("availability", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="reason">
                  Reason for applying
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  className={inputClass}
                  value={form.reason}
                  onChange={(e) => update("reason", e.target.value)}
                />
              </div>

              {status === "error" ? (
                <p className="sm:col-span-2 text-sm text-red-400">{errorMsg}</p>
              ) : null}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-[#0A0A0A] transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "#C6A55A" }}
                >
                  {status === "submitting"
                    ? "Submitting…"
                    : "Apply for Execution Support Review"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-10 text-xs text-[#8A8A8A] leading-relaxed">
            The Milano Seal is not a law firm. Routing snapshots remain subject
            to receiving-authority review.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
