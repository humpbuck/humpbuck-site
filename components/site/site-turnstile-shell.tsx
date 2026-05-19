"use client";

import type { ReactNode } from "react";
import { TurnstileScriptProvider } from "@/lib/turnstile-context";

/** Wraps storefront layout so wholesale + contact modal share one Turnstile script/context. */
export function SiteTurnstileShell({ children }: { children: ReactNode }) {
  return <TurnstileScriptProvider>{children}</TurnstileScriptProvider>;
}
