"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/lib/i18n/navigation";
import { BrandLogo } from "./BrandLogo";
import { LocaleSwitcher } from "./LocaleSwitcher";

const navItems = [
  { href: "/" as const, labelKey: "home" as const },
  { href: "/botola-pro" as const, labelKey: "botolaPro" as const },
  { href: "/botola-2" as const, labelKey: "botola2" as const },
  { href: "/news" as const, labelKey: "news" as const },
];

export function MobileNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-11 xl:hidden"
            aria-label={t("menu")}
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-3/4 sm:max-w-xs">
        <SheetHeader>
          <SheetTitle>
            <BrandLogo size={28} />
          </SheetTitle>
        </SheetHeader>
        <nav aria-label={t("menu")} className="flex flex-col gap-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.labelKey}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-md px-2 text-base font-medium hover:bg-muted"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between border-t p-4">
          <span className="text-sm text-muted-foreground">{t("menu")}</span>
          <LocaleSwitcher />
        </div>
      </SheetContent>
    </Sheet>
  );
}
