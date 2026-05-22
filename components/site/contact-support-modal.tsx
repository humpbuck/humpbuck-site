"use client";

import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { CenterModal } from "@/components/ui/center-modal";

const ContactSupportForm = dynamic(
  () =>
    import("@/components/site/ContactSupportForm").then((m) => m.ContactSupportForm),
  { ssr: false },
);

export function ContactSupportModal({
  onClose,
  defaultSubject,
  defaultMessage,
  layer = "default",
}: {
  onClose: () => void;
  defaultSubject?: string;
  defaultMessage?: string;
  layer?: "default" | "elevated";
}) {
  const locale = useLocale();
  const t = useTranslations("ContactForm");

  return (
    <CenterModal title={t("modalTitle")} onClose={onClose} size="wide" layer={layer}>
      <ContactSupportForm
        key={`contact-fab-${locale}-${defaultSubject ?? ""}-${defaultMessage?.slice(0, 32) ?? ""}`}
        onClose={onClose}
        defaultSubject={defaultSubject}
        defaultMessage={defaultMessage}
      />
    </CenterModal>
  );
}
