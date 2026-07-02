import type { CountryAcceptanceProfile } from "@/lib/milano-seal/global-acceptance/global-acceptance-types";
export function CountryAcceptanceCard({ profile }: { profile: CountryAcceptanceProfile }) { return <article className="rounded-2xl border border-amber-300/20 p-4"><h3>{profile.countryName}</h3><p>{profile.hagueStatus}</p><p>{profile.clientFacingSummary}</p></article>; }
