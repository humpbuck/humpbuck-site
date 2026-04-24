"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PasswordInputWithToggle } from "@/components/auth/password-input-with-toggle";
import { sanitizeCallbackUrl } from "@/lib/auth-callback-url";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(
    searchParams.get("callbackUrl"),
    "/shop",
  );
  const resetOk = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        No account?{" "}
        <Link
          href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-ink underline"
        >
          Create one
        </Link>
      </p>
      {resetOk && (
        <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Your password was updated. You can sign in below.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-4 py-3 text-sm outline-none ring-ink/20 focus:ring-2"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            Password
          </label>
          <PasswordInputWithToggle
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-2 text-right">
            <Link
              href="/auth/forgot-password"
              className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
            >
              Forgot password?
            </Link>
          </p>
        </div>
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-ink py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-muted">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
