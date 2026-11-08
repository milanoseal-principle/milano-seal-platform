import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { portalRONProjection } from "@/lib/bluenotary/projection";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import { normalizeExecutionTruth } from "@/lib/matter/executionTruth";
import { ClientProgressSpine } from "@/components/portal/ClientProgressSpine";
import { PortalRONStatusCard } from "@/components/ron/PortalRONStatusCard";
import type { RONSession, RONSigner } from "@/lib/bluenotary/types";
import { emailsMatch, normalizeEmail } from "@/lib/auth/clientAccount";

export const metadata: Metadata = { title: "Remote Online Notarization | The Milano Seal™", description: "Your governed remote signing session." };

export default async function PortalRONPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login?next=/portal/ron");

  const email = normalizeEmail(user.email);
  const admin = createAdminClient();
  const { data: candidate } = await admin.from("deals").select("id, deal_id, email, status, deal_status, document_type, execution_truth, scheduled_at, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, payment_observed_amount, payment_observed_currency, payment_observed_reference, currency, wise_reference, amount_due, amount_paid, payment_disposition, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, verified_revenue").eq("email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const deal = candidate && emailsMatch(candidate.email, email) ? candidate : null;

  if (!deal) return <main className="mx-auto max-w-2xl px-4 py-16"><h1 className="text-3xl text-[#F6F1E6]">Your signing session</h1><p className="mt-4 text-sm text-white/55">No active Matter was found. Contact your Milano coordinator if you need assistance.</p></main>;

  const reference = String(deal.deal_id ?? deal.id);
  const truth = normalizeExecutionTruth((deal.execution_truth ?? {}) as Record<string, unknown>);
  const scheduling = evaluateSchedulingGate({ matter: deal });
  const notarialReview = truth.notarial_act === "review_required";
  const { data: session } = await admin.from("ron_sessions").select("*").eq("matter_id", deal.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: signers } = session ? await admin.from("ron_signers").select("id, email, signing_url_encrypted, signing_url_released, identity_status, kba_status, biometric_status").eq("ron_session_id", session.id) : { data: [] };
  if (session) {
    const verified = await admin.rpc('ron_statutory_evidence_verified', {p_session:session.id});
    session.statutory_evidence_verified = !verified.error && verified.data === true;
  }
  const projection = session ? portalRONProjection(session as RONSession, (signers ?? []) as RONSigner[], email) : null;
  const ronStatus = projection?.milano_ron_status ?? null;
  const matterStatus = String(deal.deal_status ?? deal.status ?? "");
  const progressStage =
    ronStatus === "SIGNED_DOCS_RETRIEVED" ||
    ronStatus === "READY_FOR_APOSTILLE" ||
    matterStatus === "apostille_processing"
      ? "apostille"
      : "signing";

  return (
    <main className="mx-auto min-h-[calc(100svh-5rem)] max-w-4xl overflow-x-hidden px-4 py-10 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-14">
      <ClientProgressSpine current={progressStage} />
      <header className="mb-8 mt-10"><p className="text-[10px] uppercase tracking-[0.3em] text-[#C6A65B]">Remote Online Notarization</p><h1 className="mt-3 text-3xl font-medium tracking-tight text-[#F6F1E6] sm:text-5xl">Your signing session</h1><p className="mt-3 break-all text-sm tracking-[0.12em] text-white/45">Matter {reference}</p></header>

      {notarialReview && (
        <section className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5 sm:p-7" aria-labelledby="notarial-review"><p className="text-[10px] uppercase tracking-[0.25em] text-amber-300">Notarial act</p><h2 id="notarial-review" className="mt-2 text-xl text-[#F6F1E6]">Milano review required</h2><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-white/40">Why</dt><dd className="mt-1 leading-6 text-white/70">The execution type must be confirmed before the signing session can be created.</dd></div><div><dt className="text-white/40">What happens next</dt><dd className="mt-1 leading-6 text-white/70">Milano is reviewing the document for execution setup.</dd></div><div><dt className="text-white/40">Client action</dt><dd className="mt-1 leading-6 text-white/70">None required unless Milano requests clarification.</dd></div></dl><div aria-disabled="true" className="mt-6 min-h-11 rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-center text-sm text-white/50">Awaiting Milano Review</div></section>
      )}

      {!notarialReview && !session && (
        <section className="rounded-2xl border border-[#C6A65B]/25 bg-black/50 p-5 sm:p-7"><p className="text-[10px] uppercase tracking-[0.25em] text-[#C6A65B]">{scheduling.schedulingEligible ? "Ready to schedule" : "RON not ready"}</p><h2 className="mt-3 text-2xl text-[#F6F1E6]">{scheduling.schedulingEligible ? "Your Matter is cleared for remote online notarization." : "A governed requirement remains open."}</h2><p className="mt-4 text-sm leading-6 text-white/60">{scheduling.schedulingEligible ? "Milano will provide real session availability and reserve your signing time through the existing scheduler. No additional payment is required." : scheduling.reason}</p><p className="mt-5 text-xs uppercase tracking-[0.18em] text-white/40">Estimated signing time · 15–30 minutes</p><ul className="mt-4 grid gap-2 text-sm text-white/65 sm:grid-cols-2"><li>Government-issued photo ID</li><li>Camera-enabled phone or computer</li><li>Stable internet connection</li><li>Quiet location</li></ul><div className="mt-6 min-h-11 rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-center text-sm text-white/50">{deal.scheduled_at ? `Session reserved · ${new Date(deal.scheduled_at).toLocaleString("en-US", { timeZoneName: "short" })}` : "Session availability is coordinated by Milano"}</div></section>
      )}

      {projection && <PortalRONStatusCard projection={projection} matterReference={reference} />}
    </main>
  );
}
