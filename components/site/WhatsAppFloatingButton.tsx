"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { CenterModal } from "@/components/ui/center-modal";
import { FAB_SHOW_AFTER_SCROLL_PX } from "@/lib/floating-actions";
import { supportMailtoHref } from "@/lib/support-email";
import {
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
  whatsappHrefWithBody,
} from "@/lib/whatsapp";

function isHomePathname(pathname: string | null): boolean {
  return pathname === "/";
}

const STACK_BTN =
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border shadow-lg shadow-ink/8 backdrop-blur-md transition duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Fixed bottom-right — WhatsApp + support email stacked; email expands upward on
 * hover/focus. Homepage: hidden until scroll past `FAB_SHOW_AFTER_SCROLL_PX`.
 */
export function WhatsAppFloatingButton() {
  const tWa = useTranslations("WhatsAppFab");
  const tFloat = useTranslations("Floating");
  const tProduct = useTranslations("Product");
  const pathname = usePathname();
  const isHome = isHomePathname(pathname);
  const [href, setHref] = useState(WHATSAPP_URL);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [homeFabRevealed, setHomeFabRevealed] = useState(false);
  const [stackOpen, setStackOpen] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);

  const fabVisible = !isHome || homeFabRevealed;
  const mailto = supportMailtoHref();
  const emailExpanded = stackOpen || coarsePointer;

  const openStack = useCallback(() => setStackOpen(true), []);
  const closeStack = useCallback(() => setStackOpen(false), []);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const apply = () => setCoarsePointer(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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
      <div
        className={`fixed bottom-28 right-6 z-40 flex flex-col items-center gap-3 md:bottom-32 md:right-8 ${
          fabVisible
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
        aria-hidden={!fabVisible}
        onMouseEnter={openStack}
        onMouseLeave={closeStack}
        onFocusCapture={openStack}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            closeStack();
          }
        }}
      >
        <a
          href={mailto}
          className={[
            STACK_BTN,
            "border-line bg-paper/95 text-ink hover:bg-white hover:shadow-xl focus-visible:outline-ink/25",
            "transition-all duration-200 ease-out",
            emailExpanded
              ? "pointer-events-auto max-h-14 scale-100 opacity-100"
              : "pointer-events-none max-h-0 scale-90 overflow-hidden opacity-0",
          ].join(" ")}
          aria-label={tFloat("ariaEmail")}
          aria-hidden={!emailExpanded}
          tabIndex={fabVisible && emailExpanded ? 0 : -1}
        >
          <Mail className="h-6 w-6 shrink-0" strokeWidth={2} aria-hidden />
        </a>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={[
            STACK_BTN,
            "border-white/35 bg-[#25D366]/50 text-white hover:border-white/50 hover:bg-[#25D366]/68 hover:shadow-xl focus-visible:outline-emerald-500/80",
          ].join(" ")}
          aria-label={tWa("ariaContact")}
          aria-haspopup="dialog"
          aria-expanded={confirmOpen}
          tabIndex={fabVisible ? 0 : -1}
        >
          <MessageCircle
            className="h-7 w-7 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </div>

      {confirmOpen && (
        <CenterModal
          title={tWa("modalTitle")}
          onClose={() => setConfirmOpen(false)}
        >
          <p className="text-sm leading-relaxed text-ink/85">
            {tWa("modalBody", { phone: WHATSAPP_DISPLAY })}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink/85 transition hover:bg-ink/4"
            >
              {tWa("cancel")}
            </button>
            <button
              type="button"
              onClick={openWhatsapp}
              className="rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20bd5a]"
            >
              {tWa("confirm")}
            </button>
          </div>
        </CenterModal>
      )}
    </>
  );
}
