"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Search,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/ranking", label: "Ranking", icon: Search },
];

export function AdminSidebar({
  email,
  signOutAction,
}: {
  email: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col border-b border-border bg-card md:min-h-screen md:w-60 md:border-b-0 md:border-e">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
        <BrandLogo showWordmark={false} size={28} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            KooraLive
          </p>
          <p className="text-xs text-muted-foreground">Admin console</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col md:overflow-visible">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t border-border p-3">
        <p className="truncate px-1 text-xs text-muted-foreground" title={email}>
          {email}
        </p>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm" className="w-full">
            <LogOut data-icon="inline-start" />
            Sign out
          </Button>
        </form>
        <Link
          href="/fr"
          className="inline-flex items-center gap-1.5 px-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to site
        </Link>
      </div>
    </aside>
  );
}
