"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { InstitutionalReviewPanel } from "@/components/dashboard/institutional/InstitutionalReviewPanel";

// Operator review of a document issued by a supranational or intergovernmental organisation.
// The Matter reference in the URL is resolved to the canonical Matter id by the existing API.
export default function MatterInstitutionalReviewPage() {
  const params = useParams<{ matterId: string }>();
  const matterId = params?.matterId ?? "";
  const [resolved, setResolved] = useState<{ id: string; reference: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matterId) return;
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/deals/${encodeURIComponent(matterId)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(response.status === 404 ? "Matter not found." : response.status === 401 || response.status === 403 ? "You are not authorized to view this Matter." : "The Matter could not be loaded.");
        const row = (await response.json()) as { id?: string; deal_id?: string };
        if (!row.id) throw new Error("The Matter could not be loaded.");
        if (active) setResolved({ id: row.id, reference: row.deal_id ?? row.id });
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "The Matter could not be loaded.");
      }
    })();
    return () => { active = false; };
  }, [matterId]);

  return (
    <main className="space-y-7 pb-16">
      <section className="rounded-3xl border border-[var(--ms-gold)]/20 bg-[#0d0d0d] p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.22em] text-[var(--ms-gold)]">Matter Control · Institutional Document Review</div>
        <h1 className="mt-3 text-2xl font-semibold text-white md:text-3xl">Institutional evidence and pathway approval</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
          For documents issued by a supranational or intergovernmental organisation. The three pathways are candidates recommended by the HCCH Working Group (1 December 2017); none applies until its requirements are evidenced from an official source and approved here. Nothing on this screen establishes that an authority will act on the document or that a receiving authority will accept it.
        </p>
        <Link href={`/dashboard/matters/${encodeURIComponent(matterId)}`} className="mt-4 inline-flex text-xs font-medium text-[var(--ms-gold)]">← Back to Matter{resolved ? ` ${resolved.reference}` : ""}</Link>
      </section>
      {error ? (
        <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-400/[0.04] p-5 text-sm text-red-200">{error}</p>
      ) : !resolved ? (
        <p className="text-sm text-white/45" role="status">Loading Matter…</p>
      ) : (
        <InstitutionalReviewPanel matterId={resolved.id} />
      )}
    </main>
  );
}
