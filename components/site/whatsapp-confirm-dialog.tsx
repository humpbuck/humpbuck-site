"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { CenterModal } from "@/components/ui/center-modal";
import { WHATSAPP_DISPLAY, WHATSAPP_URL, whatsappHrefWithBody } from "@/lib/whatsapp";

/** Current page URL pre-filled for WhatsApp, same as the floating action button. */
export function useWhatsAppPageHref() {
  const pathname = usePathname();
  const tProduct = useTranslations("Product");
  const [href, setHref] = useState(WHATSAPP_URL);

  useEffect(() => {
    queueMicrotask(() => {
      const pageUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
      setHref(whatsappHrefWithBody(tProduct("whatsappPrefillPage", { url: pageUrl })));
    });
  }, [pathname, tProduct]);

  return href;
}

export function WhatsAppConfirmDialog({
  open,
  onClose,
  href,
}: {
  open: boolean;
  onClose: () => void;
  href: string;
}) {
  const tWa = useTranslations("WhatsAppFab");

  if (!open) return null;

  return (
    <CenterModal title={tWa("modalTitle")} onClose={onClose}>
      <p className="text-sm leading-relaxed text-ink/85">
        {tWa("modalBody", { phone: WHATSAPP_DISPLAY })}
      </p>
      <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink/85 transition hover:bg-ink/4"
        >
          {tWa("cancel")}
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            window.open(href, "_blank", "noopener,noreferrer");
          }}
          className="rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20bd5a]"
        >
          {tWa("confirm")}
        </button>
      </div>
    </CenterModal>
  );
}
