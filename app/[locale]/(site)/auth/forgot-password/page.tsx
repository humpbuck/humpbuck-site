"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const raw = await res.text();
      let data: { ok?: boolean; error?: string; message?: string; detail?: string } =
        {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setError(
          raw
            ? t("forgotInvalidResponse", { status: res.status })
            : t("forgotRequestFailed", { status: res.status }),
        );
        return;
      }

      if (!res.ok) {
        const hint = data.detail ? ` ${data.detail}` : "";
        setError((data.error || t("forgotGenericError")) + hint);
        return;
      }
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? t("forgotNetworkWithMessage", { message: e.message })
          : t("forgotNetworkGeneric"),
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-serif text-3xl tracking-tight">{t("forgotCheckTitle")}</h1>
        <p className="mt-4 text-sm text-muted">
          {t("forgotCheckBody", { email })}
        </p>
        <p className="mt-8">
          <Link
            href="/auth/login"
            className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
          >
            {t("backToSignIn")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl tracking-tight">{t("forgotTitle")}</h1>
      <p className="mt-2 text-sm text-muted">
        {t("forgotIntro")}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="forgot-email"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            {t("email")}
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none ring-ink/20 focus:ring-2"
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
          {loading ? t("sending") : t("sendResetLink")}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/auth/login" className="font-medium text-ink underline">
          {t("backToSignIn")}
        </Link>
      </p>
    </div>
  );
}
