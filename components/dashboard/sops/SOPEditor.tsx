"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";

const FADE_EASE = [0.16, 1, 0.3, 1] as const;

const CATEGORIES = [
  "Intake",
  "Payment",
  "Scheduling",
  "RON",
  "Apostille",
  "Translation",
  "Courier",
  "Client Communication",
  "VA Tasks",
  "Alliance Dispatch",
  "Release Authorization",
] as const;

const STATUSES = ["draft", "published", "archived"] as const;

interface SOP {
  id: string;
  title: string;
  category: string;
  role_scope: string[];
  status: string;
  version: number;
  body_markdown: string | null;
  checklist_json: unknown;
}

interface SOPResponse {
  sop?: SOP;
  error?: string;
}

interface SOPEditorProps {
  mode: "create" | "edit";
  sopId?: string;
}

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(212,175,55,0.04)",
  border: "1px solid rgba(212,175,55,0.15)",
  color: "rgba(255,255,255,0.8)",
  borderRadius: 2,
  padding: "8px 12px",
  fontSize: 13,
  width: "100%",
  outline: "none",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-mono, monospace)",
  fontSize: 9,
  letterSpacing: "0.25em",
  color: "rgba(212,175,55,0.45)",
  marginBottom: 6,
};

export function SOPEditor({ mode, sopId }: SOPEditorProps) {
  const fetchUrl = mode === "edit" && sopId ? `/api/dashboard/sops/${sopId}` : null;
  const { data: sopData, isLoading: sopLoading } = useApi<SOPResponse>(fetchUrl);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [roleScopeText, setRoleScopeText] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [checklistText, setChecklistText] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (mode === "edit" && sopData?.sop && !hydrated) {
      const sop = sopData.sop;
      setTitle(sop.title);
      setCategory(sop.category);
      setRoleScopeText(sop.role_scope.join(" "));
      setStatus(sop.status);
      setBodyMarkdown(sop.body_markdown ?? "");
      setChecklistText(
        sop.checklist_json
          ? JSON.stringify(sop.checklist_json, null, 2)
          : ""
      );
      setHydrated(true);
    }
  }, [mode, sopData, hydrated]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    let checklistParsed: unknown = null;
    if (checklistText.trim()) {
      try {
        checklistParsed = JSON.parse(checklistText.trim()) as unknown;
      } catch {
        setError("Checklist JSON is invalid. Please check the format.");
        return;
      }
    }

    const roleScope = roleScopeText
      .split(/\s+/)
      .map((r) => r.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      category,
      role_scope: roleScope,
      status,
      body_markdown: bodyMarkdown.trim() || null,
      checklist_json: checklistParsed,
      ...(mode === "edit" ? { change_note: changeNote.trim() || null } : {}),
    };

    setSubmitting(true);

    try {
      const url =
        mode === "create"
          ? "/api/dashboard/sops"
          : `/api/dashboard/sops/${sopId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await res.json()) as { sop_id?: string; success?: boolean; error?: string; migration_needed?: boolean };

      if (!res.ok) {
        if (body.migration_needed) {
          setError("SOP table is pending migration. Contact your administrator.");
        } else {
          setError(body.error ?? `Request failed (${res.status})`);
        }
        setSubmitting(false);
        return;
      }

      const redirectId = mode === "create" ? body.sop_id : sopId;
      window.location.href = `/dashboard/sops/${redirectId}`;
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  const pageTitle = mode === "create" ? "New SOP" : "Edit SOP";

  return (
    <motion.div
      className="space-y-6 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: FADE_EASE }}
    >
      {/* Back link */}
      <Link href={mode === "edit" && sopId ? `/dashboard/sops/${sopId}` : "/dashboard/sops"}>
        <div
          className="flex items-center gap-2 text-xs font-mono tracking-widest w-fit"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {mode === "edit" ? "BACK TO SOP" : "BACK TO SOPs"}
        </div>
      </Link>

      {/* Header */}
      <div>
        <p
          className="text-[9px] font-mono tracking-[0.3em] mb-1"
          style={{ color: "rgba(212,175,55,0.4)" }}
        >
          INTERNAL · {mode === "create" ? "CREATE" : "EDIT"}
        </p>
        <h1
          className="text-xl font-light"
          style={{
            color: "rgba(255,255,255,0.75)",
            fontFamily: "var(--font-playfair),Georgia,serif",
          }}
        >
          {pageTitle}
        </h1>
      </div>

      {sopLoading && mode === "edit" ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 rounded-sm animate-pulse"
              style={{ background: "rgba(212,175,55,0.04)" }}
            />
          ))}
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div
            className="rounded-sm px-5 py-5 space-y-4"
            style={{
              background: "rgba(8,5,1,0.97)",
              border: "1px solid rgba(212,175,55,0.12)",
            }}
          >
            {/* Title */}
            <div>
              <label style={LABEL_STYLE}>TITLE *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter SOP title..."
                style={INPUT_STYLE}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label style={LABEL_STYLE}>CATEGORY *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={INPUT_STYLE}
              >
                {CATEGORIES.map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                    style={{ background: "rgba(8,5,1,0.97)", color: "rgba(255,255,255,0.8)" }}
                  >
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label style={LABEL_STYLE}>STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={INPUT_STYLE}
              >
                {STATUSES.map((s) => (
                  <option
                    key={s}
                    value={s}
                    style={{ background: "rgba(8,5,1,0.97)", color: "rgba(255,255,255,0.8)" }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Role scope */}
            <div>
              <label style={LABEL_STYLE}>ROLE SCOPE</label>
              <input
                type="text"
                value={roleScopeText}
                onChange={(e) => setRoleScopeText(e.target.value)}
                placeholder="e.g. va virtual_assistant intake_assistant"
                style={INPUT_STYLE}
              />
              <p
                className="mt-1 font-mono"
                style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}
              >
                Space-separated roles. Use &quot;va&quot; to scope to all VA roles.
              </p>
            </div>
          </div>

          <div
            className="rounded-sm px-5 py-5 space-y-4"
            style={{
              background: "rgba(8,5,1,0.97)",
              border: "1px solid rgba(212,175,55,0.12)",
            }}
          >
            {/* Body markdown */}
            <div>
              <label style={LABEL_STYLE}>PROCEDURE BODY (MARKDOWN)</label>
              <textarea
                value={bodyMarkdown}
                onChange={(e) => setBodyMarkdown(e.target.value)}
                placeholder="Write the procedure in plain text or Markdown..."
                rows={12}
                style={{
                  ...INPUT_STYLE,
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 12,
                  resize: "vertical",
                  lineHeight: 1.6,
                }}
              />
            </div>

            {/* Checklist JSON */}
            <div>
              <label style={LABEL_STYLE}>CHECKLIST (JSON)</label>
              <textarea
                value={checklistText}
                onChange={(e) => setChecklistText(e.target.value)}
                placeholder={'[{"label": "Verify document authenticity", "required": true}]'}
                rows={6}
                style={{
                  ...INPUT_STYLE,
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 11,
                  resize: "vertical",
                }}
              />
              <p
                className="mt-1 font-mono"
                style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}
              >
                Enter JSON array: [{"{"}
                &quot;label&quot;: &quot;...&quot;, &quot;required&quot;: true
                {"}"}]
              </p>
            </div>

            {/* Change note (edit only) */}
            {mode === "edit" && (
              <div>
                <label style={LABEL_STYLE}>CHANGE NOTE</label>
                <input
                  type="text"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="Describe what changed in this version..."
                  style={INPUT_STYLE}
                />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-sm px-4 py-3"
              style={{
                background: "rgba(252,129,74,0.08)",
                border: "1px solid rgba(252,129,74,0.25)",
              }}
            >
              <p
                className="text-xs font-mono"
                style={{ color: "rgba(252,129,74,0.9)" }}
              >
                {error}
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-sm px-5 py-2.5 text-xs font-mono tracking-widest transition-opacity"
              style={{
                background: "rgba(212,175,55,0.15)",
                border: "1px solid rgba(212,175,55,0.3)",
                color: "rgba(212,175,55,0.9)",
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {submitting
                ? "SAVING..."
                : mode === "create"
                ? "CREATE SOP"
                : "SAVE CHANGES"}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
