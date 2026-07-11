const TTL_MS = 5 * 60 * 1000;

type PreviewCacheEntry = {
  clientSecret: string;
  amountCents: number;
  fetchedAt: number;
};

let previewCache: PreviewCacheEntry | null = null;
let inflight: Promise<string | null> | null = null;

function amountCentsFromUsd(amountUsd: number): number {
  return Math.max(50, Math.round(amountUsd * 100));
}

export function peekStripePreviewClientSecret(amountUsd: number): string | null {
  const amountCents = amountCentsFromUsd(amountUsd);
  if (
    previewCache &&
    previewCache.amountCents === amountCents &&
    Date.now() - previewCache.fetchedAt < TTL_MS
  ) {
    return previewCache.clientSecret;
  }
  return null;
}

export async function fetchStripePreviewClientSecret(amountUsd: number): Promise<string | null> {
  const amountCents = amountCentsFromUsd(amountUsd);
  const cached = peekStripePreviewClientSecret(amountUsd);
  if (cached) return cached;

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalUsd: amountCents / 100 }),
      });
      const data = (await res.json()) as { ok?: boolean; clientSecret?: string };
      if (!res.ok || !data.ok || !data.clientSecret) return null;
      previewCache = {
        clientSecret: data.clientSecret,
        amountCents,
        fetchedAt: Date.now(),
      };
      return data.clientSecret;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function prefetchStripePreviewClientSecret(amountUsd: number): void {
  if (amountUsd <= 0) return;
  void fetchStripePreviewClientSecret(amountUsd);
}
