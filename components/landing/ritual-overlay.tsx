"use client";

import { RitualEntryLock } from "@/components/ritual/RitualEntryLock";

const HOMEPAGE_STEPS = [
  "Verifying secure workspace",
  "Preparing Global Document Intelligence",
  "Reviewing execution pathway",
  "Checking payment-gated scheduling",
  "Structuring chain-of-custody visibility",
  "Ready for review",
];

export function RitualOverlay() {
  return (
    <RitualEntryLock
      steps={HOMEPAGE_STEPS}
      sectionLabel="Structuring secure matter environment"
      sessionKey="milano_ritual_home_seen"
    />
  );
}
