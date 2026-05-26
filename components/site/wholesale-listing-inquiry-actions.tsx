"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { ContactSupportModal } from "@/components/site/contact-support-modal";
import { CenterModal } from "@/components/ui/center-modal";
import { formatPrice } from "@/lib/catalog";
import { routing } from "@/i18n/routing";
import type { WholesaleListingClientRow } from "@/lib/wholesale-listing-shared";
import { wholesaleListingPublicPath } from "@/lib/wholesale-listing-shared";
import {
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
  whatsappHrefWithBody,
} from "@/lib/whatsapp";

const inquiryBtn =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-stone-400/35 bg-paper px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/90 shadow-sm transition hover:border-ink/20 hover:bg-stone-100/90";

export function WholesaleListingInquiryActions({
  listing,
}: {
  listing: WholesaleListingClientRow;
}) {
  const t = useTranslations("WholesalePage");
  const tWa = useTranslations("WhatsAppFab");
  const locale = useLocale();
  const [href, setHref] = useState(WHATSAPP_URL);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const modelLabel = listing.modelNumber.trim() || t("listingsModalFallbackTitle");
  const priceLabel = formatPrice(listing.priceUsd);

  useEffect(() => {
    queueMicrotask(() => {
      const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      const listingPath = `${pathPrefix}${wholesaleListingPublicPath(listing.slug)}`;
      const pageUrl = `${window.location.origin}${listingPath}`;
      setHref(
        whatsappHrefWithBody(
          t("listingWhatsappPrefill", {
            model: modelLabel,
            price: priceLabel,
            description: listing.description.trim(),
            url: pageUrl,
          }),
        ),
      );
    });
  }, [t, locale, modelLabel, priceLabel, listing.description, listing.slug]);

  const openWhatsapp = useCallback(() => {
    setConfirmOpen(false);
    window.open(href, "_blank", "noopener,noreferrer");
  }, [href]);

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={inquiryBtn}
          aria-haspopup="dialog"
          aria-expanded={confirmOpen}
        >
          <MessageCircle size={18} />
          {t("whatsappButton")}
        </button>
        <button type="button" onClick={() => setEmailModalOpen(true)} className={inquiryBtn}>
          <Mail size={18} />
          {t("emailButton")}
        </button>
      </div>

      {emailModalOpen ? (
        <ContactSupportModal
          onClose={() => setEmailModalOpen(false)}
          layer="elevated"
        />
      ) : null}

      {confirmOpen ? (
        <CenterModal
          title={tWa("modalTitle")}
          onClose={() => setConfirmOpen(false)}
          layer="elevated"
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
