"use client";

import { useEffect, useState } from "react";
import { GoldLine, GhostBtn } from "./SalesLabShared";
import { SalesLabDashboard } from "./SalesLabDashboard";
import { EcosystemTracker } from "./EcosystemTracker";
import { DMBuilder } from "./DMBuilder";
import { ContentStudio } from "./ContentStudio";
import { LeadCapture } from "./LeadCapture";
import { OfferLibrary } from "./OfferLibrary";
import { SEED_ACCOUNTS, SEED_LEADS, STORAGE_KEYS, LAB_DISCLAIMER } from "./constants";
import type { Account, Lead, SalesLabTab } from "./types";

const TABS: { id: SalesLabTab; label: string }[] = [
  { id: "snapshot", label: "Snapshot" },
  { id: "ecosystem", label: "Outreach Ecosystem" },
  { id: "dm", label: "DM Builder" },
  { id: "content", label: "Content Studio" },
  { id: "leads", label: "Lead Capture" },
  { id: "offers", label: "Offer Library" },
];

function load<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as T[];
    }
  } catch {}
  return seed;
}

export function SalesLabShell() {
  const [tab, setTab] = useState<SalesLabTab>("snapshot");
  const [accounts, setAccounts] = useState<Account[]>(SEED_ACCOUNTS);
  const [leads, setLeads] = useState<Lead[]>(SEED_LEADS);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setAccounts(load(STORAGE_KEYS.accounts, SEED_ACCOUNTS));
    setLeads(load(STORAGE_KEYS.leads, SEED_LEADS));
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts)); } catch {}
  }, [accounts]);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads)); } catch {}
  }, [leads]);

  function reset() {
    setAccounts(SEED_ACCOUNTS);
    setLeads(SEED_LEADS);
    try {
      window.localStorage.removeItem(STORAGE_KEYS.accounts);
      window.localStorage.removeItem(STORAGE_KEYS.leads);
    } catch {}
  }

  return (
    <div>
      <div className="mb-4 rounded-md border border-[#C6A55A]/25 bg-[#C6A55A]/[0.05] px-4 py-2 text-[11px] text-[#C6A55A]">
        {LAB_DISCLAIMER}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              tab === t.id ? "bg-[#C6A55A]/10 text-[#C6A55A] border border-[#C6A55A]/40" : "text-[#8A8A8A] border border-transparent hover:text-[#E8E4DC]"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto"><GhostBtn onClick={reset}>Reset demo workspace</GhostBtn></div>
      </div>

      <GoldLine className="mb-6" />

      {tab === "snapshot" && <SalesLabDashboard accounts={accounts} leads={leads} />}
      {tab === "ecosystem" && <EcosystemTracker accounts={accounts} setAccounts={setAccounts} />}
      {tab === "dm" && <DMBuilder />}
      {tab === "content" && <ContentStudio />}
      {tab === "leads" && <LeadCapture leads={leads} setLeads={setLeads} />}
      {tab === "offers" && <OfferLibrary />}

      <p className="mt-10 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-[#8A8A8A]/60">
        The Milano Seal™ Sales Intelligence Lab · Demo workspace
      </p>
    </div>
  );
}
