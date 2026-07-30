"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_55%)] opacity-[0.12]"
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLogo showWordmark={false} size={40} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Admin sign in
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Restricted area — authorized operators only.
            </p>
          </div>
        </div>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Email</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        {error ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full gap-2" disabled={pending}>
          <LockKeyhole className="size-4" aria-hidden />
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
