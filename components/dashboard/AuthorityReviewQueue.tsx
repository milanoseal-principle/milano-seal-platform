import { createAdminClient } from "@/lib/supabase/admin";
import { AuthorityReviewDecision } from "@/components/dashboard/AuthorityReviewDecision";

// Official-source changes detected by the authority monitor. An operator
// decides each one; nothing here rewrites canonical authority records.
export async function AuthorityReviewQueue() {
  const { data } = await createAdminClient()
    .from("authority_review_required")
    .select("id, authority_id, source_url, change_detected, detected_at, review_status")
    .eq("review_status", "PENDING")
    .order("detected_at", { ascending: false })
    .limit(50);
  const reviews = data ?? [];
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-5 sm:p-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C6A65B]/70">Authority Monitor</p>
      <h2 className="mt-2 font-serif text-xl text-[#F6F1E6]">Source changes awaiting review</h2>
      <p className="mt-2 text-xs text-white/45">
        Detected changes never update canonical authority records automatically. Verify against the official source, then record the decision.
      </p>
      {reviews.length === 0 ? (
        <p className="mt-3 text-xs text-white/45">No pending source changes.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-white/[0.06] bg-black/30 p-3 text-xs">
              <p className="break-words text-[#F6F1E6]/85">{review.source_url}</p>
              <p className="mt-1 text-white/50">
                {(review.change_detected as string[]).map((kind) => kind.replaceAll("_", " ")).join(", ")} · detected {String(review.detected_at).slice(0, 10)}
              </p>
              <AuthorityReviewDecision reviewId={review.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
