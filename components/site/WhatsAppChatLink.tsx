"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { whatsappInquiryHref } from "@/lib/whatsapp";

const DEFAULT_LABEL = "Chat on WhatsApp";

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
  children = DEFAULT_LABEL,
  productName,
  "aria-label": ariaLabel,
}: WhatsAppChatLinkProps) {
  const pathname = usePathname();
  const href = useMemo(() => {
    const origin = (process.env.NEXT_PUBLIC_APP_URL || "")
      .replace(/\/$/, "")
      .trim();
    if (!origin) return "#";
    const pageUrl = `${origin}${pathname}`;
    return whatsappInquiryHref(
      productName
        ? { kind: "product", productName, pageUrl }
        : { kind: "page", pageUrl },
    );
  }, [pathname, productName]);

  const label =
    ariaLabel ??
    (productName
      ? `Chat on WhatsApp about ${productName}`
      : "Chat on WhatsApp");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className}
    >
      {children}
    </a>
  );
}
