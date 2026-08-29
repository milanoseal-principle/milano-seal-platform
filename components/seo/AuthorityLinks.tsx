import Link from "next/link";

export function AuthorityLinks({ links }: { links: string[] }) {
  return (
    <nav aria-label="Related authority routes" className="grid gap-3 sm:grid-cols-2">
      {links.slice(0, 8).map((href) => (
        <Link
          className="border border-white/10 bg-white/[0.02] p-4 text-sm capitalize text-zinc-300 transition hover:border-[#C6A55A]/40 hover:text-[#C6A55A]"
          href={href}
          key={href}
        >
          {href.startsWith("/intake")
            ? "Begin Secure Records Intake"
            : href.split("?")[0].split("/").filter(Boolean).at(-1)?.replaceAll("-", " ")}
        </Link>
      ))}
    </nav>
  );
}
