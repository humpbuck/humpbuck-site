"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { whatsappHrefWithBody } from "@/lib/whatsapp";

type WhatsAppChatLinkProps = {
  className?: string;
  children?: ReactNode;
  /**
   * When set (e.g. on a product detail page), the pre-filled message includes
   * this name plus the current page URL. Omit on non-product pages to prefill
   * only the page link.
   */
  productName?: string;
  "aria-label"?: string;
};

/**
 * Site-wide WhatsApp deep link with pre-filled text: current page URL, and
 * optionally the product name when `productName` is passed.
 */
export function WhatsAppChatLink({
  className,
  children,
  productName,
  "aria-label": ariaLabel,
}: WhatsAppChatLinkProps) {
  const t = useTranslations("Product");
  const pathname = usePathname();
  const [href, setHref] = useState("#");

  useEffect(() => {
    queueMicrotask(() => {
      const pageUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
      const body = productName
        ? t("whatsappPrefillProduct", { product: productName, url: pageUrl })
        : t("whatsappPrefillPage", { url: pageUrl });
      setHref(whatsappHrefWithBody(body));
    });
  }, [pathname, productName, t]);

  const defaultChildren = children ?? t("chatWhatsApp");
  const label =
    ariaLabel ??
    (productName
      ? t("chatWhatsAppAbout", { product: productName })
      : t("chatWhatsApp"));

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className}
    >
      {defaultChildren}
    </a>
  );
}
