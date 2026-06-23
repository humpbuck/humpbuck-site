"use client";

import type { ReactNode } from "react";
import { DisplayCurrencyProvider } from "@/components/site/display-currency-context";

/** Wraps storefront layout so prices + currency FAB share one provider. */
export function SiteDisplayCurrencyShell({ children }: { children: ReactNode }) {
  return <DisplayCurrencyProvider>{children}</DisplayCurrencyProvider>;
}
