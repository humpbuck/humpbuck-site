"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { CenterModal } from "@/components/ui/center-modal";
import { FAB_SHOW_AFTER_SCROLL_PX } from "@/lib/floating-actions";
import {
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
  whatsappHrefWithBody,
} from "@/lib/whatsapp";

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
  const t = useTranslations("WhatsAppFab");
  const tProduct = useTranslations("Product");
  const pathname = usePathname();
  const isHome = isHomePathname(pathname);
  const [href, setHref] = useState(WHATSAPP_URL);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [homeFabRevealed, setHomeFabRevealed] = useState(false);

  const fabVisible = !isHome || homeFabRevealed;

  useEffect(() => {
    queueMicrotask(() => {
      const pageUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
      setHref(
        whatsappHrefWithBody(
          tProduct("whatsappPrefillPage", { url: pageUrl }),
        ),
      );
    });
  }, [pathname, tProduct]);

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
        aria-label={t("ariaContact")}
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
          title={t("modalTitle")}
          onClose={() => setConfirmOpen(false)}
        >
          <p className="text-sm leading-relaxed text-ink/85">
            {t("modalBody", { phone: WHATSAPP_DISPLAY })}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink/85 transition hover:bg-ink/4"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={openWhatsapp}
              className="rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20bd5a]"
            >
              {t("confirm")}
            </button>
          </div>
        </CenterModal>
      )}
    </>
  );
}
