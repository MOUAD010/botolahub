import Image from "next/image";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/seo/site";

export function BrandLogo({
  className,
  showWordmark = true,
  size = 32,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/kooralive-mark.svg"
        alt=""
        width={size}
        height={size}
        className="shrink-0"
        priority
      />
      {showWordmark && (
        <span className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          <span className="text-primary">Koora</span>
          <span>Live</span>
        </span>
      )}
      <span className="sr-only">{SITE_NAME}</span>
    </span>
  );
}
