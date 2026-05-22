"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StorefrontImage } from "@/components/site/storefront-image";
import { CenterModal } from "@/components/ui/center-modal";
import { formatPrice } from "@/lib/catalog";
import type { WholesaleListingRow } from "@/lib/wholesale-listing-shared";
import {
  isWholesaleVideoUrl,
  wholesaleListingPosterUrl,
} from "@/lib/wholesale-listing-shared";
import { WholesaleMediaCarousel } from "@/components/site/wholesale-media-carousel";
import { WholesaleListingInquiryActions } from "@/components/site/wholesale-listing-inquiry-actions";
import { WholesaleVideoPosterThumb } from "@/components/site/wholesale-video-poster-thumb";

const DESKTOP_PAGE_SIZE = 10;
const MOBILE_PAGE_SIZE = 5;

function useWholesalePageSize(): number {
  const [pageSize, setPageSize] = useState(MOBILE_PAGE_SIZE);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setPageSize(mq.matches ? DESKTOP_PAGE_SIZE : MOBILE_PAGE_SIZE);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return pageSize;
}

function ListingMediaThumb({
  url,
  alt,
  posterUrl,
}: {
  url: string;
  alt: string;
  posterUrl: string | null;
}) {
  if (isWholesaleVideoUrl(url)) {
    return (
      <div className="relative aspect-square w-full overflow-hidden">
        <WholesaleVideoPosterThumb
          posterUrl={posterUrl}
          videoUrl={url}
          alt={alt}
          sizes="(max-width:1023px) 100vw, 50vw"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-paper">
      <StorefrontImage
        src={url}
        alt={alt}
        fill
        className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
        sizes="(max-width:1023px) 100vw, 50vw"
      />
    </div>
  );
}

function WholesaleListingCard({
  listing,
  onOpen,
}: {
  listing: WholesaleListingRow;
  onOpen: () => void;
}) {
  const thumb = listing.mediaUrls[0] ?? "";
  const posterUrl = wholesaleListingPosterUrl(listing.mediaUrls);
  const label = listing.modelNumber.trim() || "—";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white/60 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lg lg:flex-row lg:items-stretch"
    >
      <div className="relative w-full shrink-0 overflow-hidden bg-paper lg:w-[42%] xl:w-[40%]">
        {listing.modelNumber.trim() ? (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-paper">
            {label}
          </div>
        ) : null}
        {thumb ? (
          <ListingMediaThumb url={thumb} alt={label} posterUrl={posterUrl} />
        ) : (
          <div className="aspect-square w-full bg-paper" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5 lg:justify-center">
        {listing.modelNumber.trim() ? (
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted lg:hidden">
            {label}
          </div>
        ) : null}
        <p className="mt-2 line-clamp-4 flex-1 text-sm leading-relaxed text-ink/85 lg:mt-0 lg:line-clamp-6">
          {listing.description}
        </p>
        <div className="mt-4 text-lg font-semibold tabular-nums text-ink">
          {formatPrice(listing.priceUsd)}
        </div>
      </div>
    </button>
  );
}

export function WholesaleListingsSection({
  listings,
  initialOpenSlug,
}: {
  listings: WholesaleListingRow[];
  initialOpenSlug?: string;
}) {
  const t = useTranslations("WholesalePage");
  const pageSize = useWholesalePageSize();
  const [page, setPage] = useState(1);
  const [activeListing, setActiveListing] = useState<WholesaleListingRow | null>(null);
  const openedFromLinkRef = useRef(false);

  const totalPages = Math.max(1, Math.ceil(listings.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages, pageSize]);

  useEffect(() => {
    if (!initialOpenSlug?.trim() || openedFromLinkRef.current) return;
    const listing = listings.find((item) => item.slug === initialOpenSlug.trim());
    if (!listing) return;
    openedFromLinkRef.current = true;
    const index = listings.findIndex((item) => item.id === listing.id);
    if (index >= 0) {
      setPage(Math.floor(index / pageSize) + 1);
    }
    setActiveListing(listing);
  }, [initialOpenSlug, listings, pageSize]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return listings.slice(start, start + pageSize);
  }, [listings, page, pageSize]);

  const closeModal = useCallback(() => setActiveListing(null), []);

  if (listings.length === 0) {
    return null;
  }

  return (
    <>
      <section className="mt-16 border-t border-line pt-16">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t("listingsKicker")}
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
            {t("listingsTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("listingsLead")}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {pageItems.map((listing) => (
            <WholesaleListingCard
              key={listing.id}
              listing={listing}
              onOpen={() => setActiveListing(listing)}
            />
          ))}
        </div>

        {totalPages > 1 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-line bg-paper px-5 py-2 text-[11px] font-semibold uppercase tracking-widest text-ink/85 disabled:opacity-40"
            >
              {t("listingsPrev")}
            </button>
            <span className="text-sm tabular-nums text-muted">
              {t("listingsPage", { page, total: totalPages })}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-full border border-line bg-paper px-5 py-2 text-[11px] font-semibold uppercase tracking-widest text-ink/85 disabled:opacity-40"
            >
              {t("listingsNext")}
            </button>
          </div>
        ) : null}
      </section>

      {activeListing ? (
        <CenterModal
          title={activeListing.modelNumber.trim() || t("listingsModalFallbackTitle")}
          onClose={closeModal}
          size="wide"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <WholesaleMediaCarousel
              alt={activeListing.modelNumber.trim() || "Wholesale listing"}
              mediaUrls={activeListing.mediaUrls}
            />
            <div>
              {activeListing.modelNumber.trim() ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {activeListing.modelNumber}
                </p>
              ) : null}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
                {activeListing.description}
              </p>
              <p className="mt-5 text-2xl font-semibold tabular-nums text-ink">
                {formatPrice(activeListing.priceUsd)}
              </p>
              <WholesaleListingInquiryActions listing={activeListing} />
            </div>
          </div>
        </CenterModal>
      ) : null}
    </>
  );
}
