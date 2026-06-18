"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { PasswordInputWithToggle } from "@/components/auth/password-input-with-toggle";
import { PresetAvatarImage } from "@/components/account/preset-avatar-image";
import { BUYER_AVATAR_PRESET_URLS } from "@/lib/avatar-presets";
import { sanitizeCallbackUrl } from "@/lib/auth-callback-url";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Auth");
  const returnTo = sanitizeCallbackUrl(
    searchParams.get("callbackUrl"),
    "/product",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  /** `null` = skip; `0…n-1` indexes {@link BUYER_AVATAR_PRESET_URLS}. */
  const [avatarPreset, setAvatarPreset] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          ...(avatarPreset !== null ? { avatarPreset } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || t("registrationFailed"));
        setLoading(false);
        return;
      }
      const sign = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (sign?.error) {
        setError(t("accountCreatedSignInFailed"));
        setLoading(false);
        return;
      }
      router.push(returnTo);
      router.refresh();
    } catch {
      setError(t("somethingWrong"));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl tracking-tight">{t("registerTitle")}</h1>
      <p className="mt-2 text-sm text-muted">
        {t.rich("registerHaveAccount", {
          link: (chunks) => (
            <Link
              href={`/auth/login?callbackUrl=${encodeURIComponent(returnTo)}`}
              className="font-medium text-ink underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="name"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            {t("nameOptional")}
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none ring-ink/20 focus:ring-2"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none ring-ink/20 focus:ring-2"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            {t("passwordMin8")}
          </label>
          <PasswordInputWithToggle
            id="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t("profilePhoto")}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t.rich("registerAvatarHelp", {
              gravatar: (chunks) => (
                <strong className="font-medium text-ink/90">{chunks}</strong>
              ),
            })}
          </p>
          <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-xl border border-line bg-paper/50 p-3">
            <button
              type="button"
              onClick={() => setAvatarPreset(null)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 transition ${
                avatarPreset === null
                  ? "bg-ink text-paper ring-ink"
                  : "bg-paper text-muted ring-transparent hover:ring-ink/25"
              }`}
            >
              {t("avatarNone")}
            </button>
            {BUYER_AVATAR_PRESET_URLS.map((url, idx) => (
              <button
                key={url}
                type="button"
                onClick={() => setAvatarPreset(idx)}
                className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 transition ${
                  avatarPreset === idx ? "ring-ink" : "ring-transparent hover:ring-ink/25"
                }`}
                aria-label={t("registerAvatarBuiltinAria", { n: idx + 1 })}
              >
                <PresetAvatarImage src={url} sizes="44px" />
              </button>
            ))}
          </div>
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
          {loading ? t("creating") : t("createAccount")}
        </button>
      </form>
    </div>
  );
}

function RegisterFallback() {
  const tCommon = useTranslations("Common");
  return <div className="p-16 text-center text-muted">{tCommon("loading")}</div>;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
