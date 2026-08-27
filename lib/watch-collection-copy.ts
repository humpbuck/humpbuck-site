import "server-only";

import { getTranslations } from "next-intl/server";
import {
  getWatchCategoryBySlug,
  type StorefrontWatchCategoryDef,
  type WatchCollectionMessageKey,
  watchCategoryMessageKey,
} from "@/lib/storefront-watch-categories";

export type WatchCollectionFaq = {
  question: string;
  answer: string;
};

export type WatchCollectionLocalizedCopy = {
  messageKey: WatchCollectionMessageKey;
  category: StorefrontWatchCategoryDef | null;
  path: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  h1: string;
  subtitle: string;
  intro: string;
  seoHeading: string;
  seoParagraphs: string[];
  whyHeading: string;
  whyParagraphs: string[];
  faqHeading: string;
  faqs: WatchCollectionFaq[];
};

type CategoryMessageBlock = {
  name?: string;
  metaTitle?: string;
  metaDescription?: string;
  kicker?: string;
  h1?: string;
  subtitle?: string;
  intro?: string;
  seoHeading?: string;
  seoParagraphs?: string[];
  whyHeading?: string;
  whyParagraphs?: string[];
  faqs?: WatchCollectionFaq[];
};

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function asFaqs(v: unknown): WatchCollectionFaq[] {
  if (!Array.isArray(v)) return [];
  const out: WatchCollectionFaq[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const q = asString((item as { question?: unknown }).question).trim();
    const a = asString((item as { answer?: unknown }).answer).trim();
    if (q && a) out.push({ question: q, answer: a });
  }
  return out;
}

/** Localized copy for `/watches` or a fixed collection path. */
export async function getWatchCollectionLocalizedCopy(
  locale: string,
  categorySlug: string | null,
): Promise<WatchCollectionLocalizedCopy> {
  const t = await getTranslations({ locale, namespace: "WatchCollections" });
  const messageKey = watchCategoryMessageKey(categorySlug);
  const category =
    categorySlug != null ? (getWatchCategoryBySlug(categorySlug) ?? null) : null;

  const block = t.raw(messageKey) as CategoryMessageBlock;
  const faqHeading = t("faqHeading");

  return {
    messageKey,
    category,
    path: category?.path ?? "/watches",
    name: asString(block.name, category?.name ?? ""),
    metaTitle: asString(block.metaTitle),
    metaDescription: asString(block.metaDescription),
    kicker: asString(block.kicker),
    h1: asString(block.h1),
    subtitle: asString(block.subtitle),
    intro: asString(block.intro),
    seoHeading: asString(block.seoHeading),
    seoParagraphs: asStringArray(block.seoParagraphs),
    whyHeading: asString(block.whyHeading),
    whyParagraphs: asStringArray(block.whyParagraphs),
    faqHeading,
    faqs: asFaqs(block.faqs),
  };
}
