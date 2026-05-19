"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContactSupportModal } from "@/components/site/contact-support-modal";
import { CenterModal } from "@/components/ui/center-modal";
import {
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
  whatsappHrefWithBody,
} from "@/lib/whatsapp";

const STACK_BTN =
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border shadow-lg shadow-ink/8 backdrop-blur-md transition duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Fixed bottom-right: WhatsApp visible by default; email folds above on hover/focus.
 * Email opens an in-site contact form (Brevo + Turnstile).
 */
export function WhatsAppFloatingButton() {
  const tWa = useTranslations("WhatsAppFab");
  const tFloat = useTranslations("Floating");
  const tProduct = useTranslations("Product");
  const locale = useLocale();
  const pathname = usePathname();
  const [href, setHref] = useState(WHATSAPP_URL);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalSession, setEmailModalSession] = useState(0);
  const [stackOpen, setStackOpen] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const closeStackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emailExpanded = stackOpen || coarsePointer || emailModalOpen;

  const openStack = useCallback(() => {
    if (closeStackTimer.current) {
      clearTimeout(closeStackTimer.current);
      closeStackTimer.current = null;
    }
    setStackOpen(true);
  }, []);

  const closeStack = useCallback(() => {
    if (emailModalOpen) return;
    if (closeStackTimer.current) clearTimeout(closeStackTimer.current);
    closeStackTimer.current = setTimeout(() => {
      setStackOpen(false);
      closeStackTimer.current = null;
    }, 280);
  }, [emailModalOpen]);

  useEffect(() => {
    return () => {
      if (closeStackTimer.current) clearTimeout(closeStackTimer.current);
    };
  }, []);

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

  const openWhatsapp = useCallback(() => {
    setConfirmOpen(false);
    window.open(href, "_blank", "noopener,noreferrer");
  }, [href]);

  const openEmailModal = useCallback(() => {
    openStack();
    setEmailModalSession((n) => n + 1);
    setEmailModalOpen(true);
  }, [openStack]);

  const closeEmailModal = useCallback(() => {
    setEmailModalOpen(false);
    setStackOpen(false);
  }, []);

  useEffect(() => {
    setEmailModalOpen(false);
    setConfirmOpen(false);
    setStackOpen(false);
  }, [locale, pathname]);

  return (
    <>
      <div
        className="fixed bottom-28 right-6 z-50 md:bottom-32 md:right-8"
        onMouseEnter={openStack}
        onMouseLeave={closeStack}
        onFocusCapture={openStack}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            closeStack();
          }
        }}
      >
        <div
          className={[
            "flex flex-col items-center transition-[gap] duration-200 ease-out",
            emailExpanded ? "gap-3" : "gap-0",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={openEmailModal}
            className={[
              STACK_BTN,
              "border-line bg-paper/95 text-ink hover:bg-white hover:shadow-xl focus-visible:outline-ink/25",
              "transition-all duration-200 ease-out",
              emailExpanded
                ? "pointer-events-auto h-14 scale-100 opacity-100"
                : "pointer-events-none h-0 scale-90 overflow-hidden border-0 opacity-0 shadow-none",
            ].join(" ")}
            aria-label={tFloat("ariaEmail")}
            tabIndex={emailExpanded ? 0 : -1}
          >
            <Mail className="h-6 w-6 shrink-0" strokeWidth={2} aria-hidden />
          </button>

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
          >
            <MessageCircle
              className="h-7 w-7 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {emailModalOpen ? (
        <ContactSupportModal
          key={emailModalSession}
          onClose={closeEmailModal}
        />
      ) : null}

      {confirmOpen ? (
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
      ) : null}
    </>
  );
}
