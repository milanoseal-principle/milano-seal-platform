import { confirmedExecutionRoute, requestedServiceFromNotes, requestedServiceLabel } from "@/lib/intake/requestedVsConfirmed";

// Read-only. Two separate truths, never merged: what the client asked for at
// intake, and the execution route Milano has confirmed through review.
export function RequestedVsConfirmedRoute({ notes, executionTruth, witnesses }: {
  notes: string | null | undefined;
  executionTruth: Record<string, unknown> | null | undefined;
  witnesses?: number | null;
}) {
  const requested = requestedServiceFromNotes(notes);
  const route = confirmedExecutionRoute(executionTruth, witnesses);
  return (
    <section aria-label="Requested service and confirmed execution route" data-testid="requested-vs-confirmed" className="grid gap-3 rounded-md border border-[#C6A55A]/20 bg-black/20 p-4 sm:grid-cols-2">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">Client requested service</p>
        <p className="mt-1 text-sm text-white/85 [overflow-wrap:anywhere]">{requestedServiceLabel(requested)}</p>
        <p className="mt-1 text-xs text-white/45">Acquisition context only. Never execution authority.</p>
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">Confirmed execution route</p>
        <p className={`mt-1 text-sm [overflow-wrap:anywhere] ${route.confirmed ? "text-emerald-300" : "text-amber-200"}`}>{route.label}</p>
        <p className="mt-1 text-xs text-white/45">{route.confirmed ? "Governed execution truth from Milano review." : "Owner: MILANO — confirm the route in the quote builder below."}</p>
      </div>
    </section>
  );
}
