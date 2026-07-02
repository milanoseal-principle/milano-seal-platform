export function DataSourceStatusCard({ moduleName, status = "staged", detail = "No live data connected yet." }: { moduleName: string; status?: "live" | "staged" | "planned" | "blocked"; detail?: string }) {
  return (
    <div className="rounded-2xl border border-gold/25 bg-card p-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Data Source Status</p>
      <h3 className="mt-2 font-serif text-xl text-foreground">{moduleName}</h3>
      <p className="mt-2 text-sm capitalize text-muted-foreground">Status: {status}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
