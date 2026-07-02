export function OperatorNextAction({ action }: { action: string }) {
  return (
    <div className="rounded-2xl border border-gold/25 bg-card p-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Operator Next Action</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{action}</p>
    </div>
  );
}
