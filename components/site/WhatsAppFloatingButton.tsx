"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CenterModal } from "@/components/ui/center-modal";
import {
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
  whatsappInquiryHref,
} from "@/lib/whatsapp";

function pageUrlForPathname(pathname: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "")
    .replace(/\/$/, "")
    .trim();
  if (base) return `${base}${pathname}`;
  if (typeof window !== "undefined")
    return `${window.location.origin}${pathname}`;
  return "";
}

/**
 * Fixed bottom-right — opens wa.me with page URL prefill after mount (avoids SSR
 * / hydration mismatch). Same intent as {@link WhatsAppChatLink}.
 */
export function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const [href, setHref] = useState(WHATSAPP_URL);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const pageUrl = pageUrlForPathname(pathname);
    if (pageUrl) {
      setHref(whatsappInquiryHref({ kind: "page", pageUrl }));
    } else {
      setHref(WHATSAPP_URL);
    }
  }, [pathname]);

  const openWhatsapp = useCallback(() => {
    setConfirmOpen(false);
    window.open(href, "_blank", "noopener,noreferrer");
  }, [href]);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-ink/15 transition hover:bg-[#20bd5a] hover:shadow-xl md:bottom-8 md:right-8"
        aria-label="Contact HUMPBUCK on WhatsApp"
        aria-haspopup="dialog"
        aria-expanded={confirmOpen}
      >
        <MessageCircle
          className="h-7 w-7 shrink-0"
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {confirmOpen && (
        <CenterModal
          title="Open WhatsApp?"
          onClose={() => setConfirmOpen(false)}
        >
          <p className="text-sm leading-relaxed text-ink/85">
            This will open <strong>WhatsApp</strong> so you can message
            HUMPBUCK at{" "}
            <span className="font-medium text-ink tabular-nums">
              {WHATSAPP_DISPLAY}
            </span>
            . A short line about this page may be included. Do you want to
            continue?
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink/85 transition hover:bg-ink/[0.04]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={openWhatsapp}
              className="rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20bd5a]"
            >
              Open WhatsApp
            </button>
          </div>
        </CenterModal>
      )}
    </>
  );
}
