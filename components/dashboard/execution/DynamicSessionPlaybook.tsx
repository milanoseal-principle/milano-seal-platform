"use client";

import { useEffect, useState } from "react";
import type { DynamicSessionPlaybook as Playbook } from "@/lib/pre-execution/dynamicSessionPlaybook";

const LABELS: Record<string, string> = {
  ron: "Remote Online Notarization",
  mobile: "Mobile / Travel Execution",
  in_person: "In-Person Execution",
  other: "Other",
  unknown: "Not confirmed",
  jurat: "Jurat",
  acknowledgment: "Acknowledgment",
  oath_only: "Oath / Affirmation Only",
  copy_certification: "Copy Certification",
  required: "Required",
  not_required: "Not required",
  already_completed: "Already completed",
};

function label(value: string): string {
  return LABELS[value] ?? value.replace(/_/g, " ");
}

export function DynamicSessionPlaybook({ matterId }: { matterId: string }) {
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`/api/dashboard/session-playbook/${encodeURIComponent(matterId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const body = (await response.json()) as { playbook?: Playbook; error?: string };
        if (!response.ok || !body.playbook) {
          throw new Error(body.error || "Unable to load session playbook");
        }
        if (active) setPlaybook(body.playbook);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load session playbook");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [matterId]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ms-gold)]/70">Dynamic Session Playbook</p>
        <p className="mt-3 text-sm text-white/50">Loading canonical Matter facts…</p>
      </section>
    );
  }

  if (error || !playbook) {
    return (
      <section className="rounded-2xl border border-[#E0876E]/30 bg-[#08080A]/90 p-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#E0876E]">Dynamic Session Playbook</p>
        <p className="mt-3 text-sm text-white/60">{error ?? "Playbook unavailable."}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">Operator Control</p>
          <h3 className="font-serif text-xl text-white">Dynamic Session Playbook</h3>
          <p className="mt-1 text-xs text-white/45">{playbook.matterLabel}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 font-mono text-[8px] uppercase tracking-[0.14em] ${playbook.readyForOperatorUse ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300/80" : "border-[#E0876E]/40 bg-[#C0563E]/[0.1] text-[#E0876E]"}`}>
          {playbook.readyForOperatorUse ? "Operator ready" : "Facts required"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ["Document", playbook.documentType || "Not confirmed"],
          ["Destination", playbook.destinationCountry || "Not confirmed"],
          ["Execution", label(playbook.executionMethod)],
          ["Notarial Act", label(playbook.notarialAct)],
          ["Session Time", playbook.estimatedSessionMinutes ? `${playbook.estimatedSessionMinutes} minutes` : "Not confirmed"],
          ["Oath / Affirmation", label(playbook.oathState)],
          ["Witnesses", playbook.witnessState === "required" ? `Required · ${playbook.witnessCount ?? "count not confirmed"}` : label(playbook.witnessState)],
          ["Translator", label(playbook.translatorState)],
          ["Loose Certificate", label(playbook.looseCertificateState)],
        ].map(([key, value]) => (
          <div key={key} className="rounded-xl border border-white/[0.055] bg-white/[0.015] p-3">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">{key}</p>
            <p className="mt-1 text-sm text-white/75">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <PlaybookList title="Required Documents" items={playbook.requiredDocuments} empty="No document list confirmed." />
        <PlaybookList title="Required Statements" items={playbook.requiredStatements} empty="No statements confirmed." />
        <PlaybookList title="Post Session" items={playbook.postSessionActions} empty="No post-session actions confirmed." />
      </div>

      {playbook.blockers.length > 0 && (
        <div className="mt-5 rounded-xl border border-[#E0876E]/25 bg-[#C0563E]/[0.07] p-4">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#E0876E]">Resolve Before Execution</p>
          <ul className="mt-2 space-y-1.5 text-xs text-white/65">
            {playbook.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}
          </ul>
        </div>
      )}

      {playbook.operatorNotes.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/[0.055] bg-white/[0.015] p-4">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Operator Notes</p>
          <ul className="mt-2 space-y-1.5 text-xs text-white/60">
            {playbook.operatorNotes.map((note) => <li key={note}>• {note}</li>)}
          </ul>
        </div>
      )}

      <p className="mt-4 font-mono text-[8px] leading-relaxed text-white/25">
        Generated only from stored Matter facts. Unknown requirements remain blocked for operator confirmation; no legal or receiving-authority conclusion is inferred here.
      </p>
    </section>
  );
}

function PlaybookList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-xl border border-white/[0.055] bg-white/[0.015] p-4">
      <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/60">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5 text-xs text-white/65">{items.map((item) => <li key={item}>• {item}</li>)}</ul>
      ) : (
        <p className="mt-2 text-xs text-white/35">{empty}</p>
      )}
    </div>
  );
}
