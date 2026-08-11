export function ComplimentaryAuditPanel({ authorizationId, auditEventId }: { authorizationId?: string | null; auditEventId?: string | null }) {
  return (
    <div className="rounded-2xl border border-[#8d6a22]/20 bg-[#0b0b0c]/80 p-4 text-xs leading-6 text-neutral-400">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#c99a3a]">Authorization Audit</p>
      <p>Append-only event: COMPLIMENTARY_AUTHORIZATION_APPROVED</p>
      <p>Authorization ID: <span className="font-mono text-[#f4e5b8]">{authorizationId ?? "pending server confirmation"}</span></p>
      <p>Audit ID: <span className="font-mono text-[#f4e5b8]">{auditEventId ?? "pending server confirmation"}</span></p>
      <p>No Wise transaction, payment confirmation, or verified revenue is created.</p>
    </div>
  );
}
