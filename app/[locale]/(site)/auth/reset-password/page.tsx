"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PasswordInputWithToggle } from "@/components/auth/password-input-with-toggle";
import { Suspense, useState } from "react";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Auth");
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("passwordsNoMatch"));
      return;
    }
    if (!token) {
      setError(t("missingResetToken"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || t("couldNotReset"));
        setLoading(false);
        return;
      }
      router.push("/auth/login?reset=1");
      router.refresh();
    } catch {
      setError(t("resetNetworkError"));
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-serif text-3xl tracking-tight">{t("resetInvalidTitle")}</h1>
        <p className="mt-4 text-sm text-muted">
          {t("resetInvalidBody")}
        </p>
        <p className="mt-8">
          <Link
            href="/auth/forgot-password"
            className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
          >
            {t("resetForgotLink")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl tracking-tight">{t("resetTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{t("resetIntro")}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="new-password"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            {t("newPassword")}
          </label>
          <PasswordInputWithToggle
            id="new-password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            {t("confirmNewPassword")}
          </label>
          <PasswordInputWithToggle
            id="confirm-password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          {loading ? t("saving") : t("updatePassword")}
        </button>
      </form>
    </div>
  );
}

function ResetFallback() {
  const tCommon = useTranslations("Common");
  return <div className="p-16 text-center text-muted">{tCommon("loading")}</div>;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetForm />
    </Suspense>
  );
}
