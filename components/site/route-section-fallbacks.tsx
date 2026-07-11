/** Section-sized pulse placeholders for Suspense boundaries (home, blog, shop). */

function PulseBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-ink/10 ${className ?? ""}`} aria-hidden />;
}

export function HomeProductSliderSectionFallback() {
  return (
    <section
      className="border-b border-line bg-paper py-12 sm:py-14"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6">
        <PulseBlock className="mx-auto h-8 w-48 sm:mx-0" />
        <div className="mt-8 flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[42%] shrink-0 sm:w-[28%] lg:w-[22%]">
              <PulseBlock className="aspect-square w-full rounded-xl bg-ink/[0.06]" />
              <PulseBlock className="mt-3 h-4 w-full" />
              <PulseBlock className="mt-2 h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeSpotlightSectionFallback() {
  const spotlightMobileMinH =
    "min-h-[calc((100svh-var(--site-announcement-h,0px)-72px)*0.85)]";

  return (
    <section
      className={`relative flex w-full flex-col overflow-hidden border-b border-line bg-paper ${spotlightMobileMinH} md:min-h-0 md:aspect-[4/1]`}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-4 py-6 sm:px-6 md:absolute md:inset-0 md:flex md:items-center md:py-0">
        <div className="mx-auto flex w-full max-w-7xl animate-pulse flex-col items-center gap-10 md:flex-row md:justify-center md:gap-14">
          <PulseBlock className="aspect-square w-full max-w-[min(82vw,40svh,22rem)] shrink-0 rounded-2xl bg-ink/[0.06] md:max-w-[280px] md:rounded-xl" />
          <div className="w-full max-w-[min(92vw,22rem)] space-y-4 md:max-w-xs md:items-start">
            <PulseBlock className="h-3.5 w-28" />
            <PulseBlock className="h-12 w-full" />
            <PulseBlock className="h-4 w-36" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeProductGridSectionFallback() {
  return (
    <section
      className="border-t border-line bg-paper py-16 sm:py-20"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6">
        <PulseBlock className="mx-auto h-9 w-56" />
        <div className="mt-14 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <PulseBlock className="aspect-square rounded-xl bg-ink/[0.06]" />
              <PulseBlock className="mt-3 h-4 w-full" />
              <PulseBlock className="mt-2 h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeMomentsSectionFallback() {
  return (
    <section
      className="border-b border-line bg-paper py-14 md:py-16 lg:py-20"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6">
        <PulseBlock className="mx-auto h-9 w-56" />
        <PulseBlock className="mx-auto mt-4 h-4 w-80 max-w-full" />
        <div className="mt-10 hidden gap-6 md:grid md:grid-cols-2">
          <PulseBlock className="aspect-video w-full rounded-2xl bg-ink/[0.06]" />
          <PulseBlock className="aspect-video w-full rounded-2xl bg-ink/[0.06]" />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:hidden">
          <PulseBlock className="aspect-4/5 w-full rounded-2xl bg-ink/[0.06]" />
          <PulseBlock className="aspect-4/5 w-full rounded-2xl bg-ink/[0.06]" />
        </div>
      </div>
    </section>
  );
}

export function HomeCouponSectionFallback() {
  return (
    <section
      className="relative overflow-hidden border-b border-line bg-paper"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="mx-auto flex min-h-[min(42vh,420px)] max-w-7xl animate-pulse items-center px-4 py-10 pb-14 sm:px-6 sm:py-12 sm:pb-16 md:py-14 md:pb-16 lg:py-16">
        <div className="w-full max-w-xl space-y-4">
          <PulseBlock className="h-3 w-24" />
          <PulseBlock className="h-10 w-full max-w-md" />
          <PulseBlock className="h-4 w-56" />
          <PulseBlock className="mt-4 h-12 w-full max-w-sm rounded-full" />
        </div>
      </div>
    </section>
  );
}

export function HomeCategorySlidersFallback() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <HomeProductSliderSectionFallback key={i} />
      ))}
    </>
  );
}

export function BlogPostsGridFallback() {
  return (
    <div
      className="mt-10 grid animate-pulse gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-8"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white/60">
          <PulseBlock className="aspect-[16/10] w-full rounded-none bg-ink/[0.06]" />
          <div className="space-y-2 p-5">
            <PulseBlock className="h-2 w-20" />
            <PulseBlock className="h-5 w-full" />
            <PulseBlock className="h-3 w-full bg-ink/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShopProductGridFallback() {
  return (
    <div
      className="mt-6 grid animate-pulse grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white/60">
          <PulseBlock className="aspect-square bg-ink/[0.06]" />
          <div className="space-y-2 p-4">
            <PulseBlock className="h-4 w-full" />
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, j) => (
                <PulseBlock key={j} className="h-7 w-7 rounded-md" />
              ))}
            </div>
            <PulseBlock className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** PDP — gallery + buy box (two-column main grid). */
export function ProductPdpMainFallback() {
  return (
    <div
      className="mt-8 grid min-w-0 animate-pulse grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-x-14"
      aria-busy="true"
      aria-label="Loading product"
    >
      <PulseBlock className="aspect-square rounded-[28px] bg-ink/[0.06]" />
      <div className="space-y-4">
        <PulseBlock className="h-3 w-24" />
        <PulseBlock className="h-12 w-full max-w-md" />
        <PulseBlock className="h-5 w-full max-w-lg bg-ink/[0.06]" />
        <PulseBlock className="h-10 w-32" />
        <PulseBlock className="h-12 w-full max-w-xs rounded-full" />
      </div>
    </div>
  );
}

export function ProductPdpReviewsFallback() {
  return (
    <div
      className="mt-14 animate-pulse border-t border-line pt-14"
      aria-busy="true"
      aria-label="Loading reviews"
    >
      <PulseBlock className="h-8 w-40" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <PulseBlock key={i} className="h-48 rounded-2xl bg-ink/[0.06]" />
        ))}
      </div>
    </div>
  );
}

export function ProductPdpRelatedFallback() {
  return (
    <section
      className="border-t border-line bg-paper py-14"
      aria-busy="true"
      aria-label="Loading related products"
    >
      <div className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6">
        <PulseBlock className="h-8 w-48" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white/60">
              <PulseBlock className="aspect-square bg-ink/[0.06]" />
              <div className="space-y-2 p-4">
                <PulseBlock className="h-4 w-full" />
                <PulseBlock className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
