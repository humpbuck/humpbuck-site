"use client";

import { useEffect } from "react";

type Props = {
  formIds: string[];
  storageKey: string;
};

export function RestoreScrollOnFormSubmit({ formIds, storageKey }: Props) {
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (raw) {
        const y = Number.parseFloat(raw);
        if (Number.isFinite(y) && y >= 0) {
          window.scrollTo({ top: y, behavior: "auto" });
        }
        window.sessionStorage.removeItem(storageKey);
      }
    } catch {
      // Ignore browser/storage failures.
    }

    const forms = formIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLFormElement[];
    if (forms.length === 0) return;

    const onSubmit = () => {
      try {
        window.sessionStorage.setItem(storageKey, String(window.scrollY));
      } catch {
        // Ignore browser/storage failures.
      }
    };

    for (const form of forms) {
      form.addEventListener("submit", onSubmit);
    }
    return () => {
      for (const form of forms) {
        form.removeEventListener("submit", onSubmit);
      }
    };
  }, [formIds, storageKey]);

  return null;
}
