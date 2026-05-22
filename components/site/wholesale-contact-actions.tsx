"use client";

import { CreditCard, Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContactSupportModal } from "@/components/site/contact-support-modal";
import { CenterModal } from "@/components/ui/center-modal";
import {
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
  whatsappHrefWithBody,
} from "@/lib/whatsapp";

const WHOLESALE_PAYMENT_SLUG = "wholesale-price";

const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-400/35 bg-paper px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/90 shadow-sm transition hover:border-ink/20 hover:bg-stone-100/90";

export function WholesaleContactActions() {
  const t = useTranslations("WholesalePage");
  const tWa = useTranslations("WhatsAppFab");
  const tProduct = useTranslations("Product");
  const pathname = usePathname();
  const [href, setHref] = useState(WHATSAPP_URL);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

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

  return (
    <>
      <div className="flex flex-col gap-3 sm:min-w-[240px]">
        <Link
          href={`/product/${WHOLESALE_PAYMENT_SLUG}`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--color-luxe)] px-6 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1a1306] transition hover:bg-[color:var(--color-luxe)]/90"
        >
          <CreditCard size={18} />
          {t("paymentLinkButton")}
        </Link>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={secondaryBtn}
          aria-haspopup="dialog"
          aria-expanded={confirmOpen}
        >
          <MessageCircle size={18} />
          {t("whatsappButton")}
        </button>
        <button type="button" onClick={() => setEmailModalOpen(true)} className={secondaryBtn}>
          <Mail size={18} />
          {t("emailButton")}
        </button>
        <Link
          href="/shop"
          className="text-center text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          {t("browseCatalog")}
        </Link>
      </div>

      {emailModalOpen ? (
        <ContactSupportModal onClose={() => setEmailModalOpen(false)} />
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
