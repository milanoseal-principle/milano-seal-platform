import Link from "next/link";
export function AuthorityLinks({ links, labels }: { links: string[]; labels?: Record<string, string> }) {
  return <nav aria-label="Related authority routes" className="grid gap-3 sm:grid-cols-2">{links.map((href) => <Link className="border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300 transition hover:border-[#C6A55A]/40 hover:text-[#C6A55A]" href={href} key={href}>{labels?.[href] ?? href.split("?")[0].split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") ?? "Secure intake"}</Link>)}</nav>;
}
