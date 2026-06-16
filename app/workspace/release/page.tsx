export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import Link from "next/link";

export default async function WorkspaceReleasePage() {
  await requireDashboardAccess();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="border border-[#1A1A1A] rounded-lg p-6 bg-[#080808]">
        <p className="text-[10px] font-mono tracking-[0.22em] text-[#C6A55A]/50 uppercase">
          Release Workspace
        </p>
        <h1
          className="text-2xl font-light mt-1 text-white/80"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Release QA
        </h1>
        <p className="text-[11px] font-mono mt-1 text-white/40">
          Pre-release verification and packet quality assurance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/releases"
          className="border border-[#1A1A1A] rounded-lg p-5 bg-[#0A0A0A] hover:border-[#C6A55A]/20 transition-colors group"
        >
          <p className="text-[10px] font-mono tracking-[0.18em] text-[#C6A55A]/50 uppercase mb-1">Releases</p>
          <p className="text-sm text-white/70 group-hover:text-white transition-colors">Release Desk</p>
        </Link>
        <Link
          href="/dashboard/releases/certificates"
          className="border border-[#1A1A1A] rounded-lg p-5 bg-[#0A0A0A] hover:border-[#C6A55A]/20 transition-colors group"
        >
          <p className="text-[10px] font-mono tracking-[0.18em] text-[#C6A55A]/50 uppercase mb-1">Certificates</p>
          <p className="text-sm text-white/70 group-hover:text-white transition-colors">Release Certificates</p>
        </Link>
        <Link
          href="/portal/release"
          className="border border-[#1A1A1A] rounded-lg p-5 bg-[#0A0A0A] hover:border-[#C6A55A]/20 transition-colors group"
        >
          <p className="text-[10px] font-mono tracking-[0.18em] text-[#C6A55A]/50 uppercase mb-1">Client</p>
          <p className="text-sm text-white/70 group-hover:text-white transition-colors">Client Release Coordination</p>
        </Link>
        <Link
          href="/dashboard/needs-review"
          className="border border-[#1A1A1A] rounded-lg p-5 bg-[#0A0A0A] hover:border-[#C6A55A]/20 transition-colors group"
        >
          <p className="text-[10px] font-mono tracking-[0.18em] text-[#C6A55A]/50 uppercase mb-1">Review</p>
          <p className="text-sm text-white/70 group-hover:text-white transition-colors">Needs Review Queue</p>
        </Link>
      </div>
    </div>
  );
}
