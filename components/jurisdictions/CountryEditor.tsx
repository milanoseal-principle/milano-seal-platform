"use client";

import { useState } from "react";
import type { CountryRecord } from "@/lib/jurisdictions/types";
import {
  containsBannedJurisdictionClaim,
  VERIFY_BEFORE_EXECUTION_CAPTION,
} from "@/lib/jurisdictions/jurisdictionSafety";

// Presentational form shell only — NO persistence. This never writes anywhere;
// it exists to preview jurisdiction record fields and demonstrate the
// banned-claim guard on operational notes. Data must be verified before use.

export function CountryEditor({ initial }: { initial?: CountryRecord }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [iso, setIso] = useState(initial?.iso ?? "");
  const [note, setNote] = useState("");

  const noteBanned = containsBannedJurisdictionClaim(note);

  return (
    <section className="rounded-2xl border border-amber-300/25 bg-black/50 p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Country Editor
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Presentational only — no data is saved. {VERIFY_BEFORE_EXECUTION_CAPTION}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-stone-400">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-300/15 bg-black/40 px-3 py-2 text-sm text-stone-200"
          />
        </label>
        <label className="block text-xs text-stone-400">
          ISO
          <input
            value={iso}
            onChange={(e) => setIso(e.target.value.toUpperCase())}
            maxLength={2}
            className="mt-1 w-full rounded-lg border border-amber-300/15 bg-black/40 px-3 py-2 text-sm text-stone-200"
          />
        </label>
      </div>

      <label className="mt-3 block text-xs text-stone-400">
        Operational note (no legal/immigration advice)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-amber-300/15 bg-black/40 px-3 py-2 text-sm text-stone-200"
        />
      </label>
      {noteBanned && (
        <p className="mt-2 rounded-lg border border-red-400/30 bg-red-400/5 px-3 py-2 text-[11px] text-red-200">
          Banned claim detected. Remove guaranteed-acceptance, government-approval,
          or legal/immigration-advice language.
        </p>
      )}

      <p className="mt-4 text-[10px] uppercase tracking-wide text-amber-200/60">
        Verify before execution · marked verify-before-execution
      </p>
    </section>
  );
}
