"use client";

import { useTranslations } from "next-intl";
import { CONSENT_STORAGE_KEY } from "@/lib/analytics-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

/** Clears analytics consent and reloads so the banner shows again (GA must be configured). */
export function CookieSettingsLink() {
  const t = useTranslations("Common");
  if (!GA_ID) return null;

  return (
    <button
      type="button"
      onClick={() => {
        try {
          localStorage.removeItem(CONSENT_STORAGE_KEY);
        } catch {
          /* ignore */
        }
        window.location.reload();
      }}
      className="w-fit text-left text-[12px] text-ink/75 underline-offset-2 transition hover:text-ink hover:underline"
    >
      {t("cookieSettings")}
    </button>
  );
}
