"use client";

import { useLocale } from "next-intl";
import dynamic from "next/dynamic";

const ContactSupportForm = dynamic(
  () =>
    import("@/components/site/ContactSupportForm").then((m) => m.ContactSupportForm),
  { ssr: false },
);

/** Inline contact form — same fields as the floating email modal. */
export function AboutContactForm({ instance = "about" }: { instance?: string }) {
  const locale = useLocale();
  return <ContactSupportForm key={`${instance}-contact-${locale}`} variant="inline" />;
}
