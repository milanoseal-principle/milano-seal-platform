"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { counselAttribution, counselHref } from "@/lib/counsel/inquiry";
export function CounselContextLink({
  destination,
  context,
  className,
  children,
}: {
  destination?: string;
  context: Record<string, string>;
  className?: string;
  children: ReactNode;
}) {
  const initial = counselHref(destination, context);
  const [href, setHref] = useState(initial);
  // Carry real supplied campaign values; never copy identity/referral tokens.
  useEffect(() => {
    const local = counselAttribution(
      new URLSearchParams(initial.split("?")[1]?.split("#")[0] ?? ""),
    );
    const incoming = counselAttribution(
      new URLSearchParams(window.location.search),
    );
    setHref(counselHref(destination, { ...incoming, ...local }));
  }, [destination, initial]);
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
