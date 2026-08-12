export function ComplimentaryStatusBadge({ authorized }: { authorized: boolean }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${authorized ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-[#8d6a22]/50 bg-[#c99a3a]/10 text-[#e3bd65]"}`}>
      {authorized ? "Complimentary Matter Authorized" : "Payment Required"}
    </span>
  );
}
