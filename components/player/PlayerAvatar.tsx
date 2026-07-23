"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/avatars/player-placeholder.svg";

export function PlayerAvatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = !src || failed ? PLACEHOLDER : src;

  return (
    <Image
      src={resolved}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn(
        "shrink-0 rounded-full bg-muted object-cover ring-2 ring-background",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
