import { NextResponse } from "next/server";
import {
  recordVisitorEvent,
  VISITOR_EVENT_TYPES,
  type VisitorEventType,
} from "@/lib/visitor-analytics-server";

type EventPayload = {
  sessionKey?: string;
  type?: string;
  path?: string;
  productSlug?: string;
  orderId?: string;
  source?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  meta?: Record<string, string | number | boolean | null>;
};

function detectDeviceType(ua: string): string {
  const s = ua.toLowerCase();
  if (!s) return "unknown";
  if (/bot|spider|crawler|headless/.test(s)) return "bot";
  if (/mobile|iphone|android/.test(s)) return "mobile";
  if (/ipad|tablet/.test(s)) return "tablet";
  return "desktop";
}

function detectBrowser(ua: string): string {
  const s = ua.toLowerCase();
  if (!s) return "unknown";
  if (s.includes("edg/")) return "edge";
  if (s.includes("opr/") || s.includes("opera")) return "opera";
  if (s.includes("firefox/")) return "firefox";
  if (s.includes("chrome/")) return "chrome";
  if (s.includes("safari/")) return "safari";
  return "other";
}

function firstForwardedIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for") ?? "";
  const first = xf.split(",")[0]?.trim();
  if (first) return first;
  return req.headers.get("x-real-ip")?.trim() ?? "";
}

function shouldExcludeIp(ip: string): boolean {
  if (!ip) return false;
  const raw = process.env.ANALYTICS_EXCLUDE_IPS?.trim();
  if (!raw) return false;
  const list = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return list.includes(ip);
}

function isEventType(input: string | undefined): input is VisitorEventType {
  return Boolean(input && VISITOR_EVENT_TYPES.includes(input as VisitorEventType));
}

export async function POST(req: Request) {
  let body: EventPayload;
  try {
    body = (await req.json()) as EventPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isEventType(body.type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }
  if (typeof body.sessionKey !== "string" || !body.sessionKey.trim()) {
    return NextResponse.json({ error: "Missing session key" }, { status: 400 });
  }

  if ((body.path ?? "").startsWith("/admin-ouhao")) {
    return NextResponse.json({ ok: true });
  }
  const cookieHeader = req.headers.get("cookie") ?? "";
  if (cookieHeader.includes("humpbuck_admin=")) {
    return NextResponse.json({ ok: true });
  }

  const ip = firstForwardedIp(req);
  if (shouldExcludeIp(ip)) {
    return NextResponse.json({ ok: true });
  }

  const ua = req.headers.get("user-agent") ?? "";
  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    null;
  const city = req.headers.get("x-vercel-ip-city") ?? null;

  await recordVisitorEvent({
    sessionKey: body.sessionKey,
    type: body.type,
    path: body.path,
    productSlug: body.productSlug,
    orderId: body.orderId,
    source: body.source,
    referrer: body.referrer,
    utmSource: body.utmSource,
    utmMedium: body.utmMedium,
    utmCampaign: body.utmCampaign,
    country,
    city,
    deviceType: detectDeviceType(ua),
    browser: detectBrowser(ua),
    userId: null,
    meta: body.meta,
  });

  return NextResponse.json({ ok: true });
}
