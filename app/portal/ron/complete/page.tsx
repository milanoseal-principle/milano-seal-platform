import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClientProgressSpine } from "@/components/portal/ClientProgressSpine";
import { emailsMatch, normalizeEmail } from "@/lib/auth/clientAccount";

// Only Milano-verified completion is presented as RON completion.
const EVIDENCE_IN_REVIEW = new Set(["PROVIDER_SESSION_COMPLETED", "EVIDENCE_PENDING", "EVIDENCE_VERIFIED"]);

export default async function RONReturnPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login?next=/portal/ron/complete");
  const admin = createAdminClient();
  const email = normalizeEmail(user.email);
  const { data: candidate } = await admin.from("deals").select("id, deal_id, email").eq("email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const deal = candidate && emailsMatch(candidate.email, email) ? candidate : null;
  const { data: session } = deal ? await admin.from("ron_sessions").select("ron_lifecycle_state").eq("matter_id", deal.id).order("created_at", { ascending: false }).limit(1).maybeSingle() : { data: null };
  const verified = session?.ron_lifecycle_state === "COMPLETED";
  const inReview = Boolean(session && EVIDENCE_IN_REVIEW.has(session.ron_lifecycle_state));

  return <main className="mx-auto min-h-[calc(100svh-5rem)] max-w-3xl px-4 py-10 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-16"><ClientProgressSpine current="signing" /><section className="mt-10 rounded-2xl border border-[#C6A65B]/25 bg-black/50 p-6 sm:p-10"><p className="text-[10px] uppercase tracking-[0.3em] text-[#C6A65B]">The Milano Seal™</p><h1 className="mt-4 text-3xl font-medium text-[#F6F1E6] sm:text-5xl">{verified ? "RON completed" : "Signing session received"}</h1><p className="mt-4 break-all text-sm tracking-[0.14em] text-white/45">Matter {deal?.deal_id ?? "under secure review"}</p><p className="mt-6 max-w-xl text-sm leading-7 text-white/65">{verified ? "Milano has verified the statutory execution record for this session. Your Matter now advances to its next governed step." : inReview ? "BlueNotary provider evidence has been received. Milano is validating the execution record before the Matter advances." : "Your remote notarization session has returned to Milano. A browser return does not establish completion; Milano is waiting for and validating the provider execution record."}</p><ol className="mt-8 space-y-3 text-sm"><li className="text-[#C6A65B]">● Signing session received</li><li className={verified || inReview ? "text-[#C6A65B]" : "text-white/35"}>{verified ? "● Execution verified" : inReview ? "● Execution validation" : "○ Execution validation"}</li><li className="text-white/35">○ Apostille preparation</li><li className="text-white/35">○ International release</li></ol><p className="mt-7 text-sm text-white/55">You do not need to take any action unless we contact you.</p><Link href="/portal" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#C6A65B] px-6 py-3 text-sm font-semibold text-black transition-colors duration-150 hover:bg-[#d6b96f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F1E6] motion-reduce:transition-none">Return to Matter</Link></section></main>;
}
