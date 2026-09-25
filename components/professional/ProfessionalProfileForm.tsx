"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Field, FormNotice, fieldClass, primaryButtonClass } from "./ProfessionalFormPrimitives";

type Mode = "create" | "edit";

const EMPTY = {
  firm_name: "",
  contact_name: "",
  title: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  website: "",
  practice_focus: "",
  preferred_language: "",
  preferred_destination_countries: "",
  typical_document_types: "",
  preferred_execution_method: "no_preference",
  default_receiving_authority: "",
  default_client_handoff_mode: "professional_submits",
  client_instruction_template: "",
  notification_preference: "all_milestones",
};
type ProfileForm = typeof EMPTY;

const TEXT_FIELDS: Array<[keyof ProfileForm, string, string?]> = [
  ["firm_name", "Firm"],
  ["contact_name", "Contact name"],
  ["title", "Title"],
  ["email", "Professional email"],
  ["phone", "Phone"],
  ["country", "Country"],
  ["city", "City / office"],
  ["website", "Website", "https://"],
  ["practice_focus", "Practice focus"],
  ["preferred_language", "Preferred language"],
  ["preferred_destination_countries", "Preferred destination countries", "Comma separated"],
  ["typical_document_types", "Typical document types", "Comma separated"],
  ["default_receiving_authority", "Default receiving authority", "e.g. Comune, notaio, registry"],
];

export function ProfessionalProfileForm({ mode }: { mode: Mode }) {
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit") return;
    void (async () => {
      const response = await fetch("/api/professional/account");
      if (!response.ok) return;
      const body = (await response.json()) as { profile?: Record<string, unknown> };
      const profile = body.profile ?? {};
      setStatus(String(profile.status ?? ""));
      setForm((current) => {
        const next = { ...current };
        for (const key of Object.keys(EMPTY) as Array<keyof ProfileForm>) {
          const value = profile[key];
          if (Array.isArray(value)) next[key] = value.join(", ");
          else if (typeof value === "string") next[key] = value;
        }
        return next;
      });
    })();
  }, [mode]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(mode === "create" ? "/api/professional/profile" : "/api/professional/account", {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error ?? "Profile could not be saved.");
      setMessage({ tone: "success", text: body.message ?? "Profile defaults saved." });
      if (mode === "create") setForm(EMPTY);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Profile could not be saved." });
    } finally {
      setSaving(false);
    }
  }

  const set = (key: keyof ProfileForm) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {status ? <FormNotice tone="info">Profile status: {status}</FormNotice> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {TEXT_FIELDS.map(([key, label, placeholder]) => (
          <Field key={key} label={label} htmlFor={`profile-${key}`}>
            <input
              id={`profile-${key}`}
              className={fieldClass}
              value={form[key]}
              placeholder={placeholder}
              type={key === "email" ? "email" : "text"}
              required={key === "firm_name" || key === "contact_name" || key === "email"}
              disabled={mode === "edit" && key === "email"}
              onChange={(event) => set(key)(event.target.value)}
            />
          </Field>
        ))}
        <Field label="Preferred execution method" htmlFor="profile-execution">
          <select id="profile-execution" className={fieldClass} value={form.preferred_execution_method} onChange={(e) => set("preferred_execution_method")(e.target.value)}>
            <option value="no_preference">No preference</option>
            <option value="ron_when_eligible">RON when eligible</option>
            <option value="in_person">In person</option>
          </select>
        </Field>
        <Field label="Default client handoff" htmlFor="profile-handoff">
          <select id="profile-handoff" className={fieldClass} value={form.default_client_handoff_mode} onChange={(e) => set("default_client_handoff_mode")(e.target.value)}>
            <option value="professional_submits">I submit for my client</option>
            <option value="client_completes">Client completes secure intake</option>
          </select>
        </Field>
        <Field label="Matter notifications" htmlFor="profile-notifications">
          <select id="profile-notifications" className={fieldClass} value={form.notification_preference} onChange={(e) => set("notification_preference")(e.target.value)}>
            <option value="all_milestones">All milestones</option>
            <option value="key_milestones">Key milestones</option>
            <option value="exceptions_only">Exceptions only</option>
          </select>
        </Field>
      </div>
      <Field label="Client instruction template" htmlFor="profile-template" hint="Reusable firm-level instructions. Never include client identity or Matter-specific legal conclusions.">
        <textarea id="profile-template" className={`${fieldClass} min-h-28 py-3`} value={form.client_instruction_template} onChange={(e) => set("client_instruction_template")(e.target.value)} />
      </Field>
      {message ? <FormNotice tone={message.tone}>{message.text}</FormNotice> : null}
      <button type="submit" className={primaryButtonClass} disabled={saving}>
        {saving ? "Saving…" : mode === "create" ? "Create Professional Profile" : "Save Defaults"}
      </button>
    </form>
  );
}
