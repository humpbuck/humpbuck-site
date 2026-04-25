import { prisma } from "@/lib/prisma";

export const VISITOR_EVENT_TYPES = [
  "session_start",
  "page_view",
  "heartbeat",
  "product_view",
  "add_to_cart",
  "checkout_start",
  "purchase",
] as const;

export type VisitorEventType = (typeof VISITOR_EVENT_TYPES)[number];

export type VisitorEventInput = {
  sessionKey: string;
  type: VisitorEventType;
  path?: string | null;
  productSlug?: string | null;
  orderId?: string | null;
  source?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  country?: string | null;
  city?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  userId?: string | null;
  meta?: Record<string, string | number | boolean | null> | null;
};

function cleanSessionKey(input: string): string | null {
  const s = input.trim();
  if (!/^[a-zA-Z0-9_-]{8,96}$/.test(s)) return null;
  return s;
}

function cleanPath(input?: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  if (!s.startsWith("/")) return null;
  return s.slice(0, 512);
}

function cleanSlug(input?: string | null): string | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-z0-9][a-z0-9-]{0,95}$/.test(s)) return null;
  return s;
}

function cleanShort(input?: string | null, max = 96): string | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(s)) return null;
  return s.slice(0, max);
}

function cleanReferrer(input?: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.toString().slice(0, 512);
  } catch {
    return null;
  }
}

function cleanCity(input?: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  return s.slice(0, 96);
}

function cleanMeta(
  input?: Record<string, string | number | boolean | null> | null,
): string | null {
  if (!input) return null;
  const entries = Object.entries(input).slice(0, 20);
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of entries) {
    const key = k.trim().slice(0, 48);
    if (!key) continue;
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean" ||
      v === null
    ) {
      out[key] = typeof v === "string" ? v.slice(0, 256) : v;
    }
  }
  if (Object.keys(out).length === 0) return null;
  return JSON.stringify(out);
}

export async function recordVisitorEvent(input: VisitorEventInput): Promise<void> {
  const sessionKey = cleanSessionKey(input.sessionKey);
  if (!sessionKey) return;
  if (!VISITOR_EVENT_TYPES.includes(input.type)) return;

  const path = cleanPath(input.path);
  const source = cleanShort(input.source, 64);
  const productSlug = cleanSlug(input.productSlug);
  const orderId = input.orderId?.trim().slice(0, 128) || null;
  const referrer = cleanReferrer(input.referrer);
  const utmSource = cleanShort(input.utmSource, 64);
  const utmMedium = cleanShort(input.utmMedium, 64);
  const utmCampaign = cleanShort(input.utmCampaign, 64);
  const country = cleanShort(input.country, 16);
  const city = cleanCity(input.city);
  const deviceType = cleanShort(input.deviceType, 32);
  const browser = cleanShort(input.browser, 32);
  const metaJson = cleanMeta(input.meta);

  const session = await prisma.visitorSession.upsert({
    where: { sessionKey },
    update: {
      userId: input.userId ?? undefined,
      lastSeenAt: new Date(),
      country: country ?? undefined,
      city: city ?? undefined,
      deviceType: deviceType ?? undefined,
      browser: browser ?? undefined,
    },
    create: {
      sessionKey,
      userId: input.userId ?? undefined,
      firstReferrer: referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      country,
      city,
      deviceType,
      browser,
      landingPath: path,
      lastSeenAt: new Date(),
    },
    select: { id: true },
  });

  await prisma.visitorEvent.create({
    data: {
      sessionId: session.id,
      type: input.type,
      path,
      productSlug,
      orderId,
      source,
      metaJson,
    },
  });
}
