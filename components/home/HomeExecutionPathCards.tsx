import { FileCheck2, Route, Landmark, PackageCheck } from "lucide-react";

const CARDS = [
  {
    icon: FileCheck2,
    title: "Document Readiness",
    body: "Confirm document type, signer identity, and destination use.",
  },
  {
    icon: Route,
    title: "Authentication Route",
    body: "Determine apostille or legalization path based on destination country.",
  },
  {
    icon: Landmark,
    title: "State Handling",
    body: "Prepare Florida submission packet if Florida-origin notarization is used.",
  },
  {
    icon: PackageCheck,
    title: "Courier Release",
    body: "Release original documents only after payment, execution, apostille, and custody checks are complete.",
  },
] as const;

export function HomeExecutionPathCards() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map(({ icon: Icon, title, body }) => (
        <div
          key={title}
          className="rounded-xl border border-[#C6A55A]/20 bg-[#070709] p-4"
        >
          <Icon className="h-4 w-4 text-[#C6A55A]" />
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/80">
            {title}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-white/45">{body}</p>
        </div>
      ))}
    </div>
  );
}
