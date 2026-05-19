"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { CenterModal } from "@/components/ui/center-modal";

const ContactSupportForm = dynamic(
  () =>
    import("@/components/site/ContactSupportForm").then((m) => m.ContactSupportForm),
  { ssr: false },
);

class ContactModalErrorBoundary extends Component<
  { onClose: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ContactSupportForm render failed", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <CenterModal title="Email support" onClose={this.props.onClose} size="wide">
          <p className="text-sm text-red-600/90">
            The contact form could not open. Please refresh the page and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-ink px-8 py-2.5 text-sm font-semibold text-white"
          >
            Reload
          </button>
        </CenterModal>
      );
    }
    return this.props.children;
  }
}

export function ContactSupportModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("ContactForm");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  return (
    <ContactModalErrorBoundary onClose={onClose}>
      <CenterModal title={t("modalTitle")} onClose={onClose} size="wide">
        <ContactSupportForm
          key="contact-fab-form"
          siteKey={siteKey}
          onClose={onClose}
        />
      </CenterModal>
    </ContactModalErrorBoundary>
  );
}
