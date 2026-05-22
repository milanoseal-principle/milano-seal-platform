import { redirect } from "next/navigation";

export default async function OperatorLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "";
  redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
}
