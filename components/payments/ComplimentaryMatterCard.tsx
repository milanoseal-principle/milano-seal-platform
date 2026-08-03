"use client";

import { useState } from "react";
import { ComplimentaryAuthorizationDialog } from "./ComplimentaryAuthorizationDialog";
import { ComplimentarySummary } from "./ComplimentarySummary";
import { ComplimentaryAuditPanel } from "./ComplimentaryAuditPanel";
import { ComplimentaryStatusBadge } from "./ComplimentaryStatusBadge";
import { ComplimentaryRevokeDialog } from "./ComplimentaryRevokeDialog";

export function ComplimentaryMatterCard({ matterId, quoteId, originalValue, authorized = false, authorizationId = null, auditEventId = null, authorizedBy = null, reasonLabel = null, canAuthorize = true, canRevoke = true, onChange }: {
  matterId: string;
  quoteId?: string | null;
  originalValue: number;
  authorized?: boolean;
  authorizationId?: string | null;
  auditEventId?: string | null;
  authorizedBy?: string | null;
  reasonLabel?: string | null;
  canAuthorize?: boolean;
  canRevoke?: boolean;
  onChange?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="grid gap-4 rounded-3xl border border-[#8d6a22]/30 bg-[#0b0b0c]/90 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#c99a3a]">Payment Disposition</p>
          <h3 className="font-serif text-2xl text-[#f4e5b8]">Complimentary Matter Control</h3>
        </div>
        <ComplimentaryStatusBadge authorized={authorized} />
      </div>
      <ComplimentarySummary originalValue={originalValue} authorized={authorized} authorizedBy={authorizedBy ?? undefined} reasonLabel={reasonLabel ?? undefined} />
      {authorized ? (
        <>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
            Scheduling payment requirement: <strong>Satisfied by Complimentary Authorization</strong>. Continue only after every non-payment scheduling and execution gate passes.
          </div>
          <ComplimentaryAuditPanel authorizationId={authorizationId} auditEventId={auditEventId} />
          {canRevoke && authorizationId ? <ComplimentaryRevokeDialog matterId={matterId} authorizationId={authorizationId} onRevoked={onChange} /> : null}
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-[#8d6a22]/20 bg-black/30 p-4 text-sm leading-6 text-neutral-300">
            Normal operators may request review. Authorized operators may apply a Complimentary Matter disposition without marking the Matter paid.
          </div>
          {canAuthorize ? <button onClick={() => setOpen((value) => !value)} className="min-h-12 rounded-xl border border-[#c99a3a]/50 bg-[#c99a3a]/10 px-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#f4e5b8]">{open ? "Close Authorization" : "Open Complimentary Authorization"}</button> : null}
          {open ? <ComplimentaryAuthorizationDialog matterId={matterId} quoteId={quoteId} originalValue={originalValue} onAuthorized={onChange} /> : null}
        </>
      )}
    </section>
  );
}
