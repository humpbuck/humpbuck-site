/**
 * **Product** showcase video — sources are **720×1280** (9:16 portrait); encode MP4 to match.
 * On the PDP, use only via `ProductPdpMediaColumn` with `embedded` (canonical
 * placement matches DIGI-TEMP 2301: carousel above, showcase below, left column).
 * Embedded: **9:16** width-capped shell (`720×1280` sources). Parent column uses
 * `justify-end` so the block sits on the same baseline as the PDP details column
 * (see `ProductPdpMediaColumn` + product page `mt-auto` footer).
 */
export function ProductPromoVideo({
  productName,
  src,
  poster,
  embedded = false,
}: {
  productName: string;
  src: string;
  poster?: string;
  embedded?: boolean;
}) {
  const videoBoxStandalone = (
    <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-[color:var(--color-line)] bg-paper shadow-sm">
      <video
        className="absolute inset-0 block h-full w-full object-cover"
        controls
        playsInline
        preload="metadata"
        poster={poster}
        aria-label={`Product showcase video: ${productName}`}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );

  if (embedded) {
    return (
      <section className="flex w-full shrink-0 flex-col gap-3 pt-0">
        <h2 className="shrink-0 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[11px]">
          Product showcase
        </h2>
        <div className="flex w-full flex-col items-center">
          <div className="w-full max-w-[min(100%,12rem)] sm:max-w-[min(100%,16rem)] md:max-w-[min(100%,20rem)] lg:max-w-[min(100%,22rem)]">
            <div className="relative isolate aspect-[9/16] w-full overflow-hidden rounded-2xl border border-[color:var(--color-line)] bg-paper shadow-sm">
              <video
                className="absolute inset-0 z-0 block h-full w-full object-cover"
                controls
                playsInline
                preload="metadata"
                poster={poster}
                aria-label={`Product showcase video: ${productName}`}
              >
                <source src={src} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-16 border-t border-[color:var(--color-line)] pt-14">
      <h2 className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[11px]">
        Product showcase
      </h2>
      <div className="mx-auto mt-8 w-full max-w-[min(100%,12rem)] sm:mt-10 sm:max-w-[min(100%,16rem)] md:max-w-[min(100%,20rem)] lg:max-w-[min(100%,28rem)]">
        {videoBoxStandalone}
      </div>
    </section>
  );
}
