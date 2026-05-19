"use client";

import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { publicSupportEmail } from "@/lib/support-contact";

type Status = "idle" | "loading" | "success" | "error";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const FIELD =
  "mt-1.5 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15";

const LABEL =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-muted";

function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className={LABEL}>
      {children}
      {required ? (
        <span className="text-rose-600" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
    </span>
  );
}

export function ContactSupportForm({ onClose }: { onClose?: () => void }) {
  const t = useTranslations("ContactForm");
  const locale = useLocale();
  const pathname = usePathname();
  const supportEmail = publicSupportEmail();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

  const [fromEmail, setFromEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileScriptLoaded, setTurnstileScriptLoaded] = useState(false);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  const canRenderTurnstile = Boolean(siteKey);

  useEffect(() => {
    queueMicrotask(() => {
      setPageUrl(
        `${window.location.origin}${pathname}${window.location.search}`,
      );
    });
  }, [pathname]);

  useEffect(() => {
    if (!canRenderTurnstile || !turnstileScriptLoaded || !widgetRef.current || !window.turnstile) {
      return;
    }
    if (widgetId) return;
    const rendered = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
    setWidgetId(rendered);
  }, [canRenderTurnstile, siteKey, turnstileScriptLoaded, widgetId]);

  function resetTurnstile() {
    if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
    setTurnstileToken("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    if (!canRenderTurnstile) {
      setStatus("error");
      setErrorMessage(t("verifyUnavailable"));
      return;
    }
    if (!turnstileToken) {
      setStatus("error");
      setErrorMessage(t("errVerifyRequired"));
      return;
    }
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fromEmail,
          subject,
          message,
          pageUrl,
          locale,
          website,
          turnstileToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (res.ok && data.ok) {
        setStatus("success");
        return;
      }
      setStatus("error");
      setErrorMessage(data.error ?? t("errSubmitGeneric"));
      resetTurnstile();
    } catch {
      setStatus("error");
      setErrorMessage(t("errNetwork"));
      resetTurnstile();
    }
  }

  if (status === "success") {
    return (
      <div className="py-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {t("successKicker")}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/85">{t("successBody")}</p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-full bg-ink px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            {t("successClose")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {canRenderTurnstile ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileScriptLoaded(true)}
          onError={() => setErrorMessage(t("errScriptLoad"))}
        />
      ) : null}

      <p className="text-sm leading-relaxed text-muted">{t("intro")}</p>

      <form
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-5"
        onSubmit={onSubmit}
        noValidate
      >
        <label>
          <FieldLabel required>{t("labelFromEmail")}</FieldLabel>
          <input
            type="email"
            autoComplete="email"
            required
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            className={FIELD}
          />
        </label>

        <label>
          <FieldLabel>{t("labelTo")}</FieldLabel>
          <input
            type="text"
            readOnly
            value={supportEmail}
            className={`${FIELD} cursor-default text-muted`}
            tabIndex={-1}
            aria-readonly="true"
          />
        </label>

        <label className="sm:col-span-2">
          <FieldLabel>
            {t("labelSubject")}{" "}
            <span className="font-normal normal-case tracking-normal text-muted/80">
              ({t("optional")})
            </span>
          </FieldLabel>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={FIELD}
            maxLength={200}
          />
        </label>

        <label className="sm:col-span-2">
          <FieldLabel required>{t("labelMessage")}</FieldLabel>
          <textarea
            rows={3}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={FIELD}
            maxLength={5000}
            placeholder={t("messagePlaceholder")}
          />
        </label>

        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="absolute left-[-9999px] top-auto h-px w-px opacity-0"
          aria-hidden="true"
        />

        <div className="sm:col-span-2 flex flex-col gap-3 border-t border-line/70 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div ref={widgetRef} className="min-h-[65px]" />
            {!canRenderTurnstile ? (
              <p className="mt-2 text-xs leading-relaxed text-red-600/90">
                {t("verifyUnavailable")}
              </p>
            ) : null}
            {canRenderTurnstile && !turnstileToken ? (
              <p className="mt-2 text-xs text-muted">{t("verifyHint")}</p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={status === "loading" || !canRenderTurnstile}
            className="shrink-0 rounded-full bg-ink px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60 sm:min-w-[9.5rem]"
          >
            {status === "loading" ? t("submitting") : t("submit")}
          </button>
        </div>

        {errorMessage ? (
          <p className="sm:col-span-2 text-sm text-red-600/90" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </>
  );
}
