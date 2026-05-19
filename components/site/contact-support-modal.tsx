"use client";

import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { CenterModal } from "@/components/ui/center-modal";

const ContactSupportForm = dynamic(
  () =>
    import("@/components/site/ContactSupportForm").then((m) => m.ContactSupportForm),
  { ssr: false },
);

export function ContactSupportModal({ onClose }: { onClose: () => void }) {
  const locale = useLocale();
  const t = useTranslations("ContactForm");

  return (
    <CenterModal title={t("modalTitle")} onClose={onClose} size="wide">
      <ContactSupportForm key={`contact-fab-${locale}`} onClose={onClose} />
    </CenterModal>
  );
}
