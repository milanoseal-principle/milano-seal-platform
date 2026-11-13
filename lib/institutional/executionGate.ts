import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { InstitutionalLedgerError, loadInstitutionalState } from "@/lib/institutional/evidenceLedger";

// Connects the institutional evidence decision to live Matter progression.
//
// A Matter is treated as institutional once an operator has recorded an institutional review for
// it. From then on scheduling, execution start and authority-packet assembly, QA and dispatch are
// refused unless the replayed evidence currently yields VERIFIED_ROUTE. Because the decision is
// re-derived from the ledger on every call, a lapsed approval (corrected, superseded or expired
// evidence, a new review version, a rejection) blocks again immediately.
//
// This gate only ever adds a refusal. It runs after the existing payment and execution checks and
// never satisfies or replaces any of them. A read failure blocks: an unreadable ledger is never
// treated as "no review".

export type InstitutionalGate =
  | { applies: false }
  | { applies: true; allowed: boolean; decision: string; reasons: string[] };

export async function institutionalExecutionGate(db: SupabaseClient, matterId: string, now: Date = new Date()): Promise<InstitutionalGate> {
  const state = await loadInstitutionalState(db, matterId, now);
  if (!state.review || !state.evaluation) return { applies: false };
  let verified = state.evaluation.decision === "VERIFIED_ROUTE";
  if (verified) {
    const result = await db.rpc('institutional_route_is_verified', {p_matter:matterId});
    if (result.error || typeof result.data !== 'boolean') throw new InstitutionalLedgerError('INSTITUTIONAL_PROOF_UNAVAILABLE',503,'Institutional transition integrity is unavailable.');
    verified = result.data;
  }
  return { applies: true, allowed: verified, decision: state.evaluation.decision, reasons: state.evaluation.reasons };
}

// For transition paths that do not answer with a route response (the provider webhook, the pipeline
// engine). Null when the Matter may proceed; otherwise a plain reason. An unreadable ledger blocks.
export async function institutionalBlockReason(db: SupabaseClient, matterId: string): Promise<string | null> {
  try {
    const gate = await institutionalExecutionGate(db, matterId);
    if (!gate.applies || gate.allowed) return null;
    return `INSTITUTIONAL_ROUTE_NOT_VERIFIED: institutional route decision is ${gate.decision}`;
  } catch {
    return "INSTITUTIONAL_REVIEW_UNAVAILABLE: the institutional review could not be read";
  }
}

// Null when the Matter may proceed; otherwise the refusal to return.
export async function institutionalRouteRefusal(db: SupabaseClient, matterId: string): Promise<NextResponse | null> {
  try {
    const gate = await institutionalExecutionGate(db, matterId);
    if (!gate.applies || gate.allowed) return null;
    return NextResponse.json(
      {
        error: "INSTITUTIONAL_ROUTE_NOT_VERIFIED",
        message: "This Matter has an institutional document review that is not a verified, approved route. Complete the evidence and approval before the Matter proceeds.",
        institutional_decision: gate.decision,
        reasons: gate.reasons,
      },
      { status: 409 },
    );
  } catch (error) {
    const status = error instanceof InstitutionalLedgerError && error.status < 500 ? error.status : 503;
    return NextResponse.json({ error: "INSTITUTIONAL_REVIEW_UNAVAILABLE", message: "The institutional review for this Matter could not be read, so the Matter cannot proceed yet." }, { status });
  }
}
