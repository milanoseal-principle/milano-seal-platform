"use client";

import { RitualEntryLock } from "@/components/ritual/RitualEntryLock";

const STEPS = [
  "Verifying matter access",
  "Loading execution status",
  "Confirming payment and scheduling state",
  "Preparing document timeline",
  "Ready",
];

export function PortalEntryRitual({ onComplete }: { onComplete: () => void }) {
  return (
    <RitualEntryLock
      eyebrow="Secure Matter Portal"
      steps={STEPS}
      sectionLabel="Preparing your matter portal"
      footerText="SECURE WORKSPACE READY"
      onComplete={onComplete}
    />
  );
}
