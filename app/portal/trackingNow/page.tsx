import { redirect } from "next/navigation";

// Legacy compatibility route. /portal/tracking is the sole canonical tracking
// implementation; this route preserves old bookmarks/links and forwards ALL
// query parameters (matterId, tracking reference, referral source) so no Matter
// context is lost. It holds no data fetching or business logic of its own.
export default async function TrackingNowCompatibilityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else if (value != null) qs.set(key, value);
  }
  const query = qs.toString();
  redirect(`/portal/tracking${query ? `?${query}` : ""}`);
}
