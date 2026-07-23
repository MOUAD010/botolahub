"use client";

import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { searchCatalog, type SearchResult } from "@/lib/search";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { cn } from "@/lib/utils";

export function SiteSearch({ className }: { className?: string }) {
  const t = useTranslations("search");
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const deferred = useDeferredValue(query);
  const results = searchCatalog(deferred, 10);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-md", className)}>
      <label className="sr-only" htmlFor={listId}>
        {t("label")}
      </label>
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute inset-s-3 size-4 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={inputRef}
          id={listId}
          type="search"
          value={query}
          autoComplete="off"
          placeholder={t("placeholder")}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="h-10 w-full cursor-text rounded-full border border-border bg-muted/60 pe-9 ps-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/30"
        />
        {query && (
          <button
            type="button"
            className="absolute inset-e-2 flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("clear")}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && query.trim().length > 0 && (
        <div
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-80 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {results.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <ResultRow
                    item={item}
                    kindLabel={t(`kinds.${item.kind}`)}
                    onNavigate={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  item,
  kindLabel,
  onNavigate,
}: {
  item: SearchResult;
  kindLabel: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted"
    >
      {item.kind === "player" ? (
        <PlayerAvatar src={item.imageUrl} alt="" size={28} />
      ) : item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0 object-contain"
        />
      ) : (
        <span className="size-7 shrink-0 rounded-full bg-muted" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {item.title}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {kindLabel} · {item.subtitle}
        </span>
      </span>
    </Link>
  );
}
