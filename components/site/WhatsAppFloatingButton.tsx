"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContactSupportModal } from "@/components/site/contact-support-modal";
import {
  useWhatsAppPageHref,
  WhatsAppConfirmDialog,
} from "@/components/site/whatsapp-confirm-dialog";

const STACK_BTN =
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border shadow-lg shadow-ink/8 backdrop-blur-md transition duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2";

/** Fixed bottom-right: email and WhatsApp always visible. */
export function WhatsAppFloatingButton() {
  const tWa = useTranslations("WhatsAppFab");
  const tFloat = useTranslations("Floating");
  const locale = useLocale();
  const pathname = usePathname();
  const href = useWhatsAppPageHref();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const openEmailModal = useCallback(() => {
    setEmailModalOpen(true);
  }, []);

  const closeEmailModal = useCallback(() => {
    setEmailModalOpen(false);
  }, []);

  useEffect(() => {
    setEmailModalOpen(false);
    setConfirmOpen(false);
    document.body.style.overflow = "";
  }, [locale, pathname]);

  return (
    <>
      <div className="fixed bottom-28 right-6 z-50 md:bottom-32 md:right-8">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={openEmailModal}
            className={[
              STACK_BTN,
              "border-line bg-paper/95 text-ink hover:bg-white hover:shadow-xl focus-visible:outline-ink/25",
            ].join(" ")}
            aria-label={tFloat("ariaEmail")}
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
        <ContactSupportModal onClose={closeEmailModal} />
      ) : null}

      <WhatsAppConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        href={href}
      />
    </>
  );
}
