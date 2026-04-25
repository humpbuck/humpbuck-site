import { NextResponse } from "next/server";
import { auth } from "@/auth";
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

  const session = await auth();

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
    userId: session?.user?.id ?? null,
    meta: body.meta,
  });

  return NextResponse.json({ ok: true });
}
