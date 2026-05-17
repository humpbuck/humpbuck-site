"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import {
  CONSENT_STORAGE_KEY,
  GOOGLE_CONSENT_DEFAULT,
  GOOGLE_CONSENT_UPDATE_ACCEPTED,
  type StoredConsentChoice,
} from "@/lib/analytics-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

function readStoredConsent(): StoredConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (v === "accepted" || v === "rejected") return v;
  } catch {
    /* private mode */
  }
  return null;
}

export function SiteAnalyticsConsent() {
  const [choice, setChoice] = useState<StoredConsentChoice | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setReady(true);
      setChoice(readStoredConsent());
    });
  }, []);

  const onGtagLoad = useCallback(() => {
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    if (!w.gtag || !GA_ID) return;
    w.gtag("js", new Date());
    w.gtag("config", GA_ID);
    if (readStoredConsent() === "accepted") {
      w.gtag("consent", "update", GOOGLE_CONSENT_UPDATE_ACCEPTED);
    }
  }, []);

  const accept = useCallback(() => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    } catch {
      /* ignore */
    }
    setChoice("accepted");
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    if (w.gtag && GA_ID) {
      w.gtag("consent", "update", GOOGLE_CONSENT_UPDATE_ACCEPTED);
      w.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_path: `${window.location.pathname}${window.location.search}`,
      });
    }
  }, []);

  const reject = useCallback(() => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, "rejected");
    } catch {
      /* ignore */
    }
    setChoice("rejected");
  }, []);

  if (!GA_ID) {
    return null;
  }

  const consentDefaultJs = JSON.stringify(GOOGLE_CONSENT_DEFAULT);
  const shouldLoadGa = choice === "accepted";
  const showBanner = ready && choice === null;

  return (
    <>
      {shouldLoadGa ? (
        <>
          <Script id="google-consent-default" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', ${consentDefaultJs});
            `}
          </Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
            strategy="afterInteractive"
            onLoad={onGtagLoad}
          />
        </>
      ) : null}

      {ready && showBanner ? (
        <div
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-desc"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/98 p-4 shadow-(--shadow-card) backdrop-blur-md md:p-5"
          style={{
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="min-w-0 flex-1">
              <p
                id="cookie-consent-title"
                className="font-serif text-lg text-ink md:text-xl"
              >
                Analytics & cookies
              </p>
              <p
                id="cookie-consent-desc"
                className="mt-2 text-sm leading-relaxed text-muted"
              >
                We use Google Analytics only if you accept — to understand traffic
                and improve the site. Essential cookies needed for checkout and
                security always apply. See our{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-ink/90 underline underline-offset-2 hover:text-ink"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={reject}
                className="rounded-2xl border border-line bg-white/90 px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/85 transition hover:border-ink/15 hover:bg-white"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={accept}
                className="rounded-2xl bg-luxe px-5 py-3 text-center text-[12px] font-bold uppercase tracking-[0.12em] text-[#1a1306] transition hover:bg-luxe/90"
              >
                Accept analytics
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
