"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useServerInsertedHTML } from "next/navigation";

export type Theme = "dark" | "light" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
};

const STORAGE_KEY = "theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: "dark" | "light") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

/** Inline boot script — injected via useServerInsertedHTML (outside React tree). */
function themeBootScript(storageKey: string, defaultTheme: Theme): string {
  return `(function(){try{var d=document.documentElement;var k=${JSON.stringify(storageKey)};var def=${JSON.stringify(defaultTheme)};var t=localStorage.getItem(k)||def;var sys=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var r=(t==='dark'||t==='light')?t:sys;d.classList.remove('light','dark');d.classList.add(r);d.style.colorScheme=r;}catch(e){}})();`;
}

function subscribeSystem(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getSystemSnapshot() {
  return getSystemTheme();
}

function getServerSnapshot(): "dark" | "light" {
  return "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  enableSystem = true,
  // Kept for API compatibility with previous next-themes usage
  attribute: _attribute = "class",
  disableTransitionOnChange: _disableTransitionOnChange = false,
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
  attribute?: string;
  disableTransitionOnChange?: boolean;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);
  const systemTheme = useSyncExternalStore(
    subscribeSystem,
    getSystemSnapshot,
    getServerSnapshot
  );

  useServerInsertedHTML(() => (
    <script
      dangerouslySetInnerHTML={{
        __html: themeBootScript(storageKey, defaultTheme),
      }}
    />
  ));

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored === "dark" || stored === "light" || stored === "system") {
      setThemeState(stored);
    }
    setMounted(true);
  }, [storageKey]);

  const resolvedTheme: "dark" | "light" =
    theme === "system" && enableSystem
      ? systemTheme
      : theme === "dark"
        ? "dark"
        : "light";

  useEffect(() => {
    if (!mounted) return;
    applyTheme(resolvedTheme);
  }, [mounted, resolvedTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* ignore quota / private mode */
      }
      const resolved =
        next === "system" && enableSystem
          ? getSystemTheme()
          : next === "dark"
            ? "dark"
            : "light";
      applyTheme(resolved);
    },
    [enableSystem, storageKey]
  );

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
