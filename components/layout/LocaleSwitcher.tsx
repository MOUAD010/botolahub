"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { locales, type Locale } from "@/lib/i18n/routing";
import { localeConfig } from "@/lib/i18n/locales";
import { useParams } from "next/navigation";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function handleSelect(nextLocale: Locale) {
    router.replace(
      // @ts-expect-error -- pathname is typed against known routes
      { pathname, params },
      { locale: nextLocale }
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={`size-11 sm:size-8 ${className ?? ""}`}
            aria-label={t("language")}
          />
        }
      >
        <Languages className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleSelect(loc)}
            data-active={loc === locale}
            className="data-[active=true]:font-semibold"
          >
            {localeConfig[loc].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
