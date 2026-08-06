"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import type { AdCreative } from "@/lib/ads-types";
import { cn } from "@/lib/utils";

const ROTATE_MS = 60_000;

export function ManualAdRotator({
  creatives,
  width,
  height,
  className,
}: {
  creatives: AdCreative[];
  width: number;
  height: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const list = creatives.filter(
    (c) => Boolean(c.imageUrl?.trim() || c.htmlSnippet?.trim())
  );

  useEffect(() => {
    if (list.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [list.length]);

  if (list.length === 0) return null;

  const safeIndex = index % list.length;
  const creative = list[safeIndex]!;

  const inner = creative.htmlSnippet?.trim() ? (
    <div
      className="w-full [&_a]:underline [&_img]:mx-auto [&_img]:max-h-full [&_img]:max-w-full"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(creative.htmlSnippet),
      }}
    />
  ) : creative.imageUrl ? (
    <Image
      src={creative.imageUrl}
      alt={creative.name}
      width={width}
      height={height}
      unoptimized
      className="h-auto max-h-full w-full object-contain"
    />
  ) : null;

  if (!inner) return null;

  const content = creative.clickUrl ? (
    <a
      href={creative.clickUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block w-full"
    >
      {inner}
    </a>
  ) : (
    inner
  );

  return (
    <div
      className={cn("relative w-full transition-opacity duration-500", className)}
      data-ad-creative={creative.id}
      data-ad-rotate-count={list.length}
    >
      {content}
      {list.length > 1 ? (
        <div
          className="pointer-events-none absolute inset-e-1.5 bottom-1.5 flex gap-1"
          aria-hidden
        >
          {list.map((c, i) => (
            <span
              key={c.id}
              className={cn(
                "size-1.5 rounded-full",
                i === safeIndex ? "bg-foreground/70" : "bg-foreground/25"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
