"use client";

import { useState } from "react";

export function ComplimentaryRevokeDialog({ matterId, authorizationId, onRevoked }: { matterId: string; authorizationId: string; onRevoked?: () => void }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  async function revoke() {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/matters/${matterId}/complimentary/revoke`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ authorizationId, reason }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Revocation failed.");
      setMessage("Complimentary Authorization revoked. Payment is required again unless reauthorized.");
      onRevoked?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Revocation failed.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="grid gap-3 rounded-2xl border border-red-500/25 bg-red-950/10 p-4">
      <p className="text-sm font-semibold text-red-200">Revoke Authorization</p>
      <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Scope changed before scheduling." className="min-h-20 rounded-xl border border-red-400/30 bg-black/40 p-3 text-sm text-white" />
      {message ? <p className="text-sm text-[#e3bd65]">{message}</p> : null}
      <button disabled={reason.trim().length < 8 || submitting} onClick={revoke} className="rounded-xl border border-red-400/40 px-4 py-3 text-sm text-red-100 disabled:opacity-40">{submitting ? "Revoking..." : "Revoke Authorization"}</button>
    </div>
  );
}
