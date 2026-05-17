"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ADMIN_PATH } from "@/lib/admin-path";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push(ADMIN_PATH);
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <p className="text-center font-serif text-2xl tracking-tight">HUMPBUCK</p>
      <h1 className="mt-6 text-center text-sm font-semibold uppercase tracking-[0.16em] text-muted">
        Admin
      </h1>
      <form onSubmit={onSubmit} className="mt-10 space-y-4">
        <div>
          <label
            htmlFor="admin-secret"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            Secret
          </label>
          <input
            id="admin-secret"
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-ink/20 focus:ring-2"
            required
          />
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
      <p className="mt-8 text-center text-xs text-muted">
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to site
        </Link>
      </p>
    </div>
  );
}
