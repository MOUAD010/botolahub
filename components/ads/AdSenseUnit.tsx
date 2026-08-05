"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Shimmer placeholder while the network fills the unit. */
export function AdLoader({
  className,
  label = "Loading ad…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-md bg-muted/50",
        className
      )}
    >
      <div className="absolute inset-0 animate-pulse bg-muted/80" />
      <div className="relative flex flex-col items-center gap-2.5 px-4 py-6">
        <span
          className="size-7 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin"
          aria-hidden
        />
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}

/** Pushes one AdSense unit after mount; shows loader until iframe appears. */
export function AdSenseUnit({
  publisherId,
  unitId,
  format = "auto",
  fullWidth = true,
  minHeight = 90,
  loadingLabel = "Loading ad…",
}: {
  publisherId: string;
  unitId: string;
  format?: string;
  fullWidth?: boolean;
  minHeight?: number;
  loadingLabel?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore duplicate push / blocked */
    }

    const host = hostRef.current;
    if (!host) return;

    const markFilled = () => setFilled(true);
    if (host.querySelector("iframe")) {
      markFilled();
      return;
    }

    const obs = new MutationObserver(() => {
      if (host.querySelector("iframe")) {
        markFilled();
        obs.disconnect();
      }
    });
    obs.observe(host, { childList: true, subtree: true });

    const fallback = window.setTimeout(markFilled, 4000);
    return () => {
      obs.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div ref={hostRef} className="relative w-full" style={{ minHeight }}>
      {!filled && (
        <div className="absolute inset-0 z-10">
          <AdLoader className="h-full" label={loadingLabel} />
        </div>
      )}
      <ins
        className={cn("adsbygoogle block", !filled && "opacity-0")}
        style={{ display: "block", minHeight }}
        data-ad-client={publisherId}
        data-ad-slot={unitId}
        data-ad-format={format}
        data-full-width-responsive={fullWidth ? "true" : "false"}
      />
    </div>
  );
}
