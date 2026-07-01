"use client";

import { Card, SectionHeader, Badge } from "./SalesLabShared";
import { OFFER_LANES, OFFER_ADDONS, OFFER_NOTE } from "./constants";

// Replaces the source billing / SaaS-plan page. Reference only — no payment button,
// no checkout, no external payment rail.

export function OfferLibrary() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Offer Library" subtitle="Milano Seal execution lanes — internal reference." />

      <div className="grid gap-4 sm:grid-cols-3">
        {OFFER_LANES.map((l) => (
          <Card key={l.name}>
            <div className="flex items-center justify-between">
              <p className="font-serif text-lg text-[#E8E4DC]">{l.name}</p>
              <Badge>Lane</Badge>
            </div>
            <p className="mt-2 text-3xl font-light text-[#C6A55A]">{l.price}</p>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHeader title="Add-ons" />
        <div className="grid gap-3 sm:grid-cols-3">
          {OFFER_ADDONS.map((a) => (
            <div key={a.name} className="flex items-center justify-between rounded-lg border border-[#1E1E1E] bg-black/30 px-3 py-2.5">
              <span className="text-[13px] text-[#E8E4DC]">{a.name}</span>
              <span className="font-mono text-sm text-[#C6A55A]">{a.price}</span>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-[11px] leading-relaxed text-[#8A8A8A]">{OFFER_NOTE}</p>
    </div>
  );
}
