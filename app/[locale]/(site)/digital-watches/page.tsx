import type { Metadata } from "next";
import {
  buildWatchCollectionMetadata,
  WatchCollectionPage,
} from "@/components/site/watch-collection-page";

export const revalidate = false;

const SLUG = "digital" as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildWatchCollectionMetadata(locale, SLUG);
}

export default async function DigitalWatchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <WatchCollectionPage locale={locale} categorySlug={SLUG} />;
}
