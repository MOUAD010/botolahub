"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { AtSign, Shirt, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isHintMention,
  type MentionItem,
} from "@/lib/mentions-shared";

export type MentionListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

type MentionListProps = {
  items: MentionItem[];
  command: (item: MentionItem) => void;
};

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  function MentionList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "Enter") {
          const item = items[selectedIndex];
          if (item && !isHintMention(item)) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-lg">
          No results — try <code className="font-mono">@player</code> or{" "}
          <code className="font-mono">@match</code>
        </div>
      );
    }

    return (
      <div className="z-50 max-h-64 w-72 overflow-auto rounded-xl border border-border bg-popover p-1 shadow-xl">
        <p className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <AtSign className="size-3" aria-hidden />
          Mentions
        </p>
        <ul className="flex flex-col gap-0.5">
          {items.map((item, index) => {
            const hint = isHintMention(item);
            const Icon = item.mentionType === "player" ? Shirt : Swords;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={hint}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-start text-sm transition-colors",
                    hint
                      ? "cursor-default text-muted-foreground"
                      : "hover:bg-muted",
                    index === selectedIndex && !hint && "bg-muted"
                  )}
                  onClick={() => {
                    if (!hint) command(item);
                  }}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                      item.mentionType === "player"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {hint ? `@${item.label}` : item.label}
                    </span>
                    {item.subtitle ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
);
