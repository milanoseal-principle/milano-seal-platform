import type { USStateExecutionProfile } from "@/lib/milano-seal/global-acceptance/global-acceptance-types";
export function USStateExecutionCard({ profile }: { profile: USStateExecutionProfile }) { return <article className="rounded-2xl border border-amber-300/20 p-4"><h3>{profile.stateName}</h3><p>{profile.apostilleAuthority}</p><p>RON allowed: {String(profile.ronAllowed)}</p></article>; }
