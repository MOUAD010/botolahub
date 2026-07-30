import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import { BrandLogo } from "./BrandLogo";
import { SiteSearch } from "./SiteSearch";

const navItems = [
  { href: "/" as const, key: "home" },
  { href: "/botola-pro" as const, key: "botolaPro" },
  { href: "/news" as const, key: "news" },
];

export function Header() {
  const t = useTranslations("nav");

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-2 sm:px-6 lg:py-0 xl:px-8">
        <div className="flex h-12 items-center justify-between gap-3 lg:h-16">
          <Link
            href="/"
            className="flex shrink-0 cursor-pointer items-center"
          >
            <BrandLogo size={34} />
          </Link>

          <div className="mx-2 hidden min-w-0 flex-1 justify-center md:flex">
            <SiteSearch className="w-full max-w-lg" />
          </div>

          <nav
            aria-label={t("menu")}
            className="hidden items-center gap-1 xl:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <div className="hidden lg:block">
              <LocaleSwitcher />
            </div>
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>

        <div className="pb-2 md:hidden">
          <SiteSearch />
        </div>
      </div>
    </header>
  );
}
