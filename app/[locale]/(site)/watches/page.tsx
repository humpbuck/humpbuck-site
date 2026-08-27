import type { Metadata } from "next";
import {
  buildWatchCollectionMetadata,
  WatchCollectionPage,
} from "@/components/site/watch-collection-page";

export const revalidate = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildWatchCollectionMetadata(locale, null);
}

export default async function WatchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <WatchCollectionPage locale={locale} categorySlug={null} />;
}
