"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

/** Fire-and-forget pageview beacon for admin analytics. */
export function PageviewTracker() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    // Strip locale prefix for stable path aggregation
    const stripped = pathname.replace(new RegExp(`^/${locale}`), "") || "/";

    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: stripped, locale }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, locale]);

  return null;
}
