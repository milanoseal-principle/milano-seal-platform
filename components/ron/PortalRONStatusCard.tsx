"use client";

import type { PortalRONView } from "@/lib/bluenotary/types";

interface Props {
  projection: PortalRONView;
  matterReference: string;
}

function StatusRow({ label, detail, state }: { label: string; detail: string; state: "satisfied" | "processing" | "review" | "blocked" }) {
  const mark = state === "satisfied" ? "✓" : state === "review" ? "!" : "●";
  const color = state === "satisfied" ? "text-emerald-300" : state === "review" ? "text-amber-300" : state === "blocked" ? "text-red-300" : "text-[#C6A65B]";
  return (
    <li className="flex min-h-11 items-start gap-3 border-b border-white/10 py-3 last:border-0">
      <span aria-hidden="true" className={`${color} mt-0.5 w-4 font-semibold`}>{mark}</span>
      <span><span className="block text-sm text-[#F6F1E6]">{label}</span><span className="block text-xs leading-5 text-white/50">{detail}</span></span>
    </li>
  );
}

export function PortalRONStatusCard({ projection, matterReference }: Props) {
  const showSigningLink = Boolean(projection.signing_url && projection.scheduling_authorized && projection.session_active);
  // Provider completion and document retrieval are not Milano completion.
  const completed = projection.milano_completed === true;
  const evidenceInReview = ["PROVIDER_SESSION_COMPLETED", "EVIDENCE_PENDING", "EVIDENCE_VERIFIED"].includes(projection.ron_lifecycle_state);

  return (
    <section className="rounded-2xl border border-[#C6A65B]/25 bg-black/50 p-5 shadow-2xl backdrop-blur-md sm:p-7" aria-labelledby="signing-readiness">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] uppercase tracking-[0.28em] text-[#C6A65B]">Signing readiness</p><h2 id="signing-readiness" className="mt-2 text-2xl font-medium text-[#F6F1E6]">{projection.client_label}</h2></div>
        <p className="break-all text-xs tracking-[0.16em] text-white/45">{matterReference}</p>
      </div>

      <ul className="mt-3">
        <StatusRow label="Payment submission recorded" detail="Wise settlement verification continues automatically." state={projection.scheduling_authorized ? "satisfied" : "blocked"} />
        <StatusRow label="Scheduling authority" detail={projection.scheduling_authorized ? "Authorized. No additional payment is required." : "Awaiting canonical payment or complimentary authority."} state={projection.scheduling_authorized ? "satisfied" : "blocked"} />
        <StatusRow label="Identity verification" detail={projection.identity_status === "PASSED" ? "Provider evidence received." : "Completed securely inside the signing room."} state={projection.identity_status === "PASSED" ? "satisfied" : "processing"} />
        <StatusRow label="Knowledge-based authentication" detail={projection.kba_status === "PASSED" ? "Provider evidence received." : "Required during the provider session."} state={projection.kba_status === "FAILED" ? "review" : projection.kba_status === "PASSED" ? "satisfied" : "processing"} />
        {evidenceInReview && <StatusRow label="Execution verification" detail="BlueNotary reported the session complete. Milano is verifying the statutory execution record; no action is needed from you." state="processing" />}
        {completed && <StatusRow label="RON completion" detail="Milano verified the statutory execution record for this session." state="satisfied" />}
      </ul>

      {showSigningLink ? (
        <div className="mt-6 rounded-xl border border-[#C6A65B]/25 bg-[#C6A65B]/5 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A65B]">Preparing your secure signing room</p>
          <p className="mt-3 text-sm leading-6 text-white/65">Your Milano Matter remains active while you complete identity verification, KBA, video, and signing through BlueNotary.</p>
          <a href={projection.signing_url!} target="_blank" rel="noopener noreferrer" className="mt-5 flex min-h-11 w-full items-center justify-center rounded-lg bg-[#C6A65B] px-5 py-3 text-center text-sm font-semibold text-black transition-colors duration-150 hover:bg-[#d6b96f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F1E6] motion-reduce:transition-none">
            Enter Secure Signing Room
          </a>
          <p className="mt-4 text-xs leading-5 text-white/40">Remote notarization technology is provided through BlueNotary. The Milano Seal coordinates the execution workflow.</p>
        </div>
      ) : (
        <div className="mt-6 min-h-11 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/50">Milano will release secure session access when every execution requirement is satisfied.</div>
      )}
    </section>
  );
}
