"use client";
import { DESTINATIONS } from "@/data/destinations";
import Link from "next/link";
import { useRouter } from "next/navigation";

export { DESTINATIONS };

export function GlobalIntel({
  highlightCountry,
}: {
  highlightCountry?: string;
}) {
  const router = useRouter();
  // Show top 12 by demand for the homepage grid
  const gridDestinations = [...DESTINATIONS]
    .sort((a, b) => (b.demand || 0) - (a.demand || 0))
    .slice(0, 12);

  return (
    <section className="py-20 px-6 border-t border-[#1A1A1A]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#C6A55A] text-[9px] tracking-[0.3em] uppercase font-semibold mb-3">
              Global Intel
            </p>
            <h2 className="font-serif text-3xl text-white font-light">
              Destination Intelligence
            </h2>
            <p className="text-[#8A8A8A] text-sm mt-2 max-w-xl">
              Select your destination to view compliance requirements, execution
              path, and apostille status.
            </p>
          </div>
          <Link
            href="/map"
            className="text-[10px] tracking-[0.15em] uppercase text-[#C6A55A] border border-[#C6A55A]/30 px-4 py-2 hover:bg-[#C6A55A]/10 transition-colors hidden md:block"
          >
            Full Compliance Map →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {gridDestinations.map((d) => (
            <Link
              key={d.slug}
              href={`/apostille/${d.slug}`}
              className={`group bg-[#111111] border rounded-xl p-4 transition-all hover:border-[#C6A55A]/30 hover:bg-[#151515] ${
                highlightCountry === d.slug
                  ? "border-[#C6A55A]/50 bg-[#141210]"
                  : "border-[#1E1E1E]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{d.flag}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    d.hague
                      ? "bg-green-500/10 text-green-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {d.hague ? "Hague" : "Non-Hague"}
                </span>
              </div>
              <p className="text-white text-sm font-medium mb-1">{d.name}</p>
              <p className="text-[#8A8A8A] text-[10px] leading-relaxed">
                {d.note}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-[#1A1A1A] rounded-full h-1">
                  <div
                    className="bg-[#C6A55A] h-1 rounded-full"
                    style={{ width: `${d.demand || 20}%` }}
                  />
                </div>
                <span className="text-[9px] text-[#C6A55A]">
                  {d.demand || 0}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
