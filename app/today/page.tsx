export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import Link from "next/link";

export default async function TodayPage() {
  await requireDashboardAccess();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="border border-[#1A1A1A] rounded-lg p-6 bg-[#080808]">
        <p className="text-[10px] font-mono tracking-[0.22em] text-[#C6A55A]/50 uppercase">
          Daily Briefing
        </p>
        <h1
          className="text-2xl font-light mt-1 text-white/80"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Today
        </h1>
        <p className="text-[11px] font-mono mt-1 text-white/40">
          Operator daily briefing — matters requiring action today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/needs-review"
          className="border border-[#1A1A1A] rounded-lg p-5 bg-[#0A0A0A] hover:border-[#C6A55A]/20 transition-colors group"
        >
          <p className="text-[10px] font-mono tracking-[0.18em] text-[#C6A55A]/50 uppercase mb-1">Queue</p>
          <p className="text-sm text-white/70 group-hover:text-white transition-colors">Needs Review</p>
        </Link>
        <Link
          href="/dashboard/follow-ups"
          className="border border-[#1A1A1A] rounded-lg p-5 bg-[#0A0A0A] hover:border-[#C6A55A]/20 transition-colors group"
        >
          <p className="text-[10px] font-mono tracking-[0.18em] text-[#C6A55A]/50 uppercase mb-1">Queue</p>
          <p className="text-sm text-white/70 group-hover:text-white transition-colors">Follow-Up Queue</p>
        </Link>
        <Link
          href="/dashboard/pipeline"
          className="border border-[#1A1A1A] rounded-lg p-5 bg-[#0A0A0A] hover:border-[#C6A55A]/20 transition-colors group"
        >
          <p className="text-[10px] font-mono tracking-[0.18em] text-[#C6A55A]/50 uppercase mb-1">Pipeline</p>
          <p className="text-sm text-white/70 group-hover:text-white transition-colors">Active Matters</p>
        </Link>
        <Link
          href="/dashboard/deliveries"
          className="border border-[#1A1A1A] rounded-lg p-5 bg-[#0A0A0A] hover:border-[#C6A55A]/20 transition-colors group"
        >
          <p className="text-[10px] font-mono tracking-[0.18em] text-[#C6A55A]/50 uppercase mb-1">Delivery</p>
          <p className="text-sm text-white/70 group-hover:text-white transition-colors">Delivery Log</p>
        </Link>
      </div>
    </div>
  );
}
