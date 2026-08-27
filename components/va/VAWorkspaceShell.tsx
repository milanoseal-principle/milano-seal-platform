"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { MilanoOSShell, type MilanoOSNavItem } from "@/components/os/MilanoOSShell";
import { RitualEntryLock } from "@/components/ritual/RitualEntryLock";

const VA_NAV: MilanoOSNavItem[] = [
  { href: "/va/dashboard", label: "Overview", icon: "layout", group: "Work", hint: "Assigned execution posture" },
  { href: "/va/tasks", label: "My Tasks", icon: "list", group: "Work", hint: "Preparation queue" },
  { href: "/va/follow-ups", label: "Follow-Ups", icon: "calendar", group: "Work", hint: "Due client coordination" },
  { href: "/va/matters", label: "My Matters", icon: "briefcase", group: "Matters", hint: "Matter-scoped access" },
  { href: "/va/documents", label: "Documents", icon: "files", group: "Matters", hint: "Controlled document view" },
  { href: "/va/uploads", label: "Uploads", icon: "upload", group: "Matters", hint: "Secure file preparation" },
  { href: "/va/messages", label: "Messages", icon: "message", group: "Matters", hint: "Matter communication" },
  { href: "/va/checklists", label: "Checklists", icon: "check", group: "Execution", hint: "Pre-flight preparation" },
  { href: "/va/ron", label: "RON Coordination", icon: "shield", group: "Execution", hint: "Execution preparation" },
  { href: "/va/courier", label: "Courier", icon: "truck", group: "Execution", hint: "Delivery preparation" },
  { href: "/va/escalations", label: "Escalations", icon: "activity", group: "Control", hint: "Founder review requests" },
];

const VA_RITUAL_STEPS = [
  "Verifying assistant access",
  "Loading assigned task queue",
  "Syncing Matter coordination tools",
  "Reviewing preparation controls",
  "Workspace ready",
];
const VA_RITUAL_KEY = "ms_va_ritual_seen";

export function VAWorkspaceShell({ children }: { children: ReactNode }) {
  const [ritualDone, setRitualDone] = useState(() => {
    if (typeof window === "undefined") return true;
    return Boolean(sessionStorage.getItem(VA_RITUAL_KEY));
  });

  function completeRitual() {
    sessionStorage.setItem(VA_RITUAL_KEY, "1");
    setRitualDone(true);
  }

  return (
    <>
      {!ritualDone ? (
        <RitualEntryLock
          eyebrow="Operations Desk"
          steps={VA_RITUAL_STEPS}
          sectionLabel="Preparing Matter-scoped workspace"
          footerText="WORKSPACE READY"
          onComplete={completeRitual}
        />
      ) : null}

      <MilanoOSShell
        mode="va"
        nav={VA_NAV}
        eyebrow="Execution Support"
        title="Operations Desk"
        subtitle="Prepare · verify · coordinate · escalate"
        brandSubtitle="Operations Desk"
        identity={{ name: "Execution Support", meta: "Matter-scoped access" }}
        statusItems={[
          { label: "Scope", value: "Matter enforced", tone: "green" },
          { label: "Financial actions", value: "Restricted", tone: "neutral" },
        ]}
        footerNote="Preparation-only access · protected actions remain governed"
        maxWidth={1480}
      >
        {children}
      </MilanoOSShell>
    </>
  );
}
