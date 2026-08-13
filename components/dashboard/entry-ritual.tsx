"use client";

import { RitualEntryLock } from "@/components/ritual/RitualEntryLock";

const STEPS = [
  "Verifying operational access",
  "Reviewing active international matters",
  "Syncing apostille coordination queue",
  "Verifying courier release controls",
  "Loading execution infrastructure",
  "Workspace ready",
];

export function MilanoSealEntryRitual({ onComplete }: { onComplete: () => void }) {
  return (
    <RitualEntryLock
      eyebrow="Operator Workspace"
      steps={STEPS}
      sectionLabel="Structuring execution environment"
      footerText="WORKSPACE READY"
      sessionKey="ms-operator-entry"
      onComplete={onComplete}
    />
  );
}
