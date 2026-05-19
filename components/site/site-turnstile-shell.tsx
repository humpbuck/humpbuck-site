"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { TurnstileScriptProvider } from "@/lib/turnstile-context";

/** Wraps storefront layout so wholesale + contact modal share one Turnstile script/context. */
export function SiteTurnstileShell({ children }: { children: ReactNode }) {
  const locale = useLocale();

  return (
    <TurnstileScriptProvider key={locale}>{children}</TurnstileScriptProvider>
  );
}
