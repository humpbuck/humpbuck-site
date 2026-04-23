"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CenterModal } from "@/components/ui/center-modal";
import { FAB_SHOW_AFTER_SCROLL_PX } from "@/lib/floating-actions";
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

function isHomePathname(pathname: string | null): boolean {
  return pathname === "/";
}

/**
 * Fixed bottom-right — classic green round + outline chat icon; frosted
 * semi-transparent. On the homepage only, hidden on first paint; after the
 * user has scrolled past `FAB_SHOW_AFTER_SCROLL_PX` once, the button stays
 * visible (including if they scroll back to the top). Other routes: always
 * show.
 */
export function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const isHome = isHomePathname(pathname);
  const [href, setHref] = useState(WHATSAPP_URL);
  const [confirmOpen, setConfirmOpen] = useState(false);
  /**
   * Only on `/`: `false` until the user has scrolled down past the threshold
   * at least once; then stays `true` (latched) even when scroll returns to 0.
   */
  const [homeFabRevealed, setHomeFabRevealed] = useState(false);

  const fabVisible = !isHome || homeFabRevealed;

  useEffect(() => {
    const pageUrl = pageUrlForPathname(pathname);
    if (pageUrl) {
      setHref(whatsappInquiryHref({ kind: "page", pageUrl }));
    } else {
      setHref(WHATSAPP_URL);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isHome) {
      return;
    }
    const onScroll = () => {
      setHomeFabRevealed(
        (prev) => prev || window.scrollY > FAB_SHOW_AFTER_SCROLL_PX,
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const openWhatsapp = useCallback(() => {
    setConfirmOpen(false);
    window.open(href, "_blank", "noopener,noreferrer");
  }, [href]);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={`fixed bottom-28 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-white/35 bg-[#25D366]/50 text-white shadow-lg shadow-ink/8 backdrop-blur-md transition duration-200 hover:border-white/50 hover:bg-[#25D366]/68 hover:shadow-xl active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500/80 md:bottom-32 md:right-8 ${
          fabVisible
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
        aria-label="Contact HUMPBUCK on WhatsApp"
        aria-haspopup="dialog"
        aria-expanded={confirmOpen}
        aria-hidden={!fabVisible}
      >
        <MessageCircle
          className="h-7 w-7 shrink-0"
          strokeWidth={2}
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
              className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink/85 transition hover:bg-ink/4"
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
