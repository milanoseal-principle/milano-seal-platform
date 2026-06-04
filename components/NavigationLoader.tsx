"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MilanoPageLoader } from "@/components/animations/MilanoPageLoader";

export function NavigationLoader() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setLoading(true);
      const t = setTimeout(() => setLoading(false), 900);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  if (!loading) return null;
  return <MilanoPageLoader mode="bar" />;
}
