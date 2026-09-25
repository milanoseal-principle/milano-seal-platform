"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FormNotice, primaryButtonClass, secondaryButtonClass } from "./ProfessionalFormPrimitives";

type MatterView = {
  id: string;
  matterReference: string;
  client: string;
  destination: string;
  document: string;
  stage: string;
  nextAction: string;
  paymentPosture: string;
  executionPosture: string;
  authenticationStage: string;
  courierStage: string;
  completed: boolean;
};

export function ProfessionalMatterDashboard() {
  const [matters, setMatters] = useState<MatterView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("Final acceptance is determined by the receiving authority.");

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/professional/matters");
        const body = (await response.json().catch(() => ({}))) as {
          matters?: MatterView[];
          error?: string;
          acceptance_notice?: string;
        };
        if (!response.ok) throw new Error(body.error ?? "Matters are unavailable.");
        setMatters(body.matters ?? []);
        if (body.acceptance_notice) setNotice(body.acceptance_notice);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Matters are unavailable.");
        setMatters([]);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/professional/matters/new" className={primaryButtonClass}>Start a Client Matter</Link>
        <Link href="/professional/account" className={secondaryButtonClass}>Profile &amp; defaults</Link>
      </div>
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      {matters === null ? (
        <p role="status" className="text-sm text-white/45">Loading Matters…</p>
      ) : matters.length === 0 && !error ? (
        <FormNotice tone="info">No referred Matters yet.</FormNotice>
      ) : (
        <ul className="grid gap-3" aria-label="Referred Matters">
          {matters.map((matter) => (
            <li key={matter.id} className="rounded-2xl border border-white/[0.07] bg-[#09090A] p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#C6A65B]/65">{matter.matterReference}</p>
                  <h2 className="mt-1 truncate font-serif text-xl text-white">{matter.client}</h2>
                  <p className="text-sm text-white/45">{matter.document} → {matter.destination}</p>
                </div>
                <span className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs ${matter.stage === "Review required" ? "border-amber-400/35 text-amber-200" : matter.completed ? "border-[#C6A65B]/40 text-[#C6A65B]" : "border-white/[0.12] text-white/70"}`}>
                  {matter.stage}
                </span>
              </div>
              <p className="mt-3 text-sm text-white/55">{matter.nextAction}</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                {([
                  ["Payment", matter.paymentPosture],
                  ["Execution", matter.executionPosture],
                  ["Authentication / apostille", matter.authenticationStage],
                  ["Courier", matter.courierStage],
                ] as const).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-white/35">{label}</dt>
                    <dd className="text-white/75">{value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs leading-5 text-white/30">{notice}</p>
    </div>
  );
}
