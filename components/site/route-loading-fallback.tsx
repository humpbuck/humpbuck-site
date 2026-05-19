import { Loader2 } from "lucide-react";

/** Shared pulse skeleton blocks for App Router `loading.tsx` routes. */
export function RouteLoadingFallback({ variant = "page" }: { variant?: "page" | "product" }) {
  if (variant === "product") {
    return (
      <div
        className="mx-auto min-w-0 max-w-7xl animate-pulse py-10 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:py-14"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="h-4 w-28 rounded bg-ink/10" />
        <div className="mt-8 grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-x-14">
          <div className="relative aspect-square rounded-[28px] bg-ink/[0.06]">
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2
                className="size-10 animate-spin text-digital"
                strokeWidth={2}
                aria-hidden
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-3 w-24 rounded bg-ink/10" />
            <div className="h-12 w-full max-w-md rounded bg-ink/10" />
            <div className="h-5 w-full max-w-lg rounded bg-ink/[0.06]" />
            <div className="h-10 w-32 rounded bg-ink/10" />
            <div className="h-12 w-full max-w-xs rounded-full bg-ink/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-7xl animate-pulse px-4 py-12 sm:px-6 lg:py-16"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="h-3 w-20 rounded bg-ink/10" />
      <div className="mt-4 h-10 w-64 max-w-full rounded bg-ink/10" />
      <div className="mt-3 h-5 w-96 max-w-full rounded bg-ink/[0.06]" />
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white/60">
            <div className="aspect-square bg-ink/[0.06]" />
            <div className="space-y-2 p-4">
              <div className="h-2 w-16 rounded bg-ink/10" />
              <div className="h-4 w-full rounded bg-ink/10" />
              <div className="h-3 w-2/3 rounded bg-ink/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
