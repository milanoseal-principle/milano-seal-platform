"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LeadMatterAction({ leadId, matterId }: { leadId: string; matterId?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  if (matterId) return <Link href={`/dashboard/deals/${matterId}`}>Open Matter</Link>;
  async function convert() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/dashboard/leads/${leadId}/matter`, { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.matter_id) throw new Error("Matter creation was not confirmed. Retry safely or contact your administrator.");
      router.push(`/dashboard/deals/${result.matter_id}`);
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to open Matter review."); }
    finally { setBusy(false); }
  }
  return <div><button type="button" disabled={busy} onClick={() => void convert()}>{busy ? "Opening review…" : "Open Matter review"}</button>{error && <p role="alert">{error}</p>}</div>;
}
