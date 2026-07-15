import { convertCnyCentsToUsdCents, getCnyUsdExchangeRate } from "@/lib/cny-usd-exchange";
import { prisma } from "@/lib/prisma";

export const EXPRESS_METHOD_IDS = ["dhl", "fedex", "ups"] as const;
export type ExpressMethodId = (typeof EXPRESS_METHOD_IDS)[number];
export type ShippingMethodId = "standard" | ExpressMethodId;

export const EXPRESS_METHOD_TITLES: Record<ExpressMethodId, string> = {
  dhl: "Express Shipping via DHL",
  fedex: "Express Shipping via FedEx",
  ups: "Express Shipping via UPS",
};

export function isExpressMethodId(value: string): value is ExpressMethodId {
  return (EXPRESS_METHOD_IDS as readonly string[]).includes(value);
}

export function isShippingMethodId(value: string): value is ShippingMethodId {
  return value === "standard" || isExpressMethodId(value);
}

export async function ensureExpressShippingMethods() {
  for (const methodId of EXPRESS_METHOD_IDS) {
    await prisma.shippingExpressMethod.upsert({
      where: { methodId },
      create: {
        methodId,
        feeCents: 0,
        deliveryDaysLabel: "3-5 Business Days",
      },
      update: {},
    });
  }
}

export async function listExpressShippingMethods() {
  await ensureExpressShippingMethods();
  const rows = await prisma.shippingExpressMethod.findMany({
    orderBy: { methodId: "asc" },
  });
  return rows.filter((row) => isExpressMethodId(row.methodId));
}

export async function getExpressShippingMethod(methodId: ExpressMethodId) {
  return prisma.shippingExpressMethod.findUnique({ where: { methodId } });
}

export type ExpressMethodQuote = {
  methodId: ExpressMethodId;
  label: string;
  deliveryDaysLabel: string;
  feeCnyCents: number;
  totalUsdCents: number;
  available: boolean;
};

export async function quoteExpressMethod(
  methodId: ExpressMethodId,
  cnyPerUsd: number,
): Promise<ExpressMethodQuote> {
  const row = await getExpressShippingMethod(methodId);
  const feeCnyCents = Math.max(0, row?.feeCents ?? 0);
  const deliveryDaysLabel = row?.deliveryDaysLabel?.trim() || "3-5 Business Days";
  return {
    methodId,
    label: EXPRESS_METHOD_TITLES[methodId],
    deliveryDaysLabel,
    feeCnyCents,
    totalUsdCents: convertCnyCentsToUsdCents(feeCnyCents, cnyPerUsd),
    available: feeCnyCents > 0,
  };
}

export async function quoteAllExpressMethods(cnyPerUsd: number) {
  const rows = await prisma.shippingExpressMethod.findMany({
    where: { methodId: { in: [...EXPRESS_METHOD_IDS] } },
  });
  const byId = new Map(rows.map((row) => [row.methodId, row]));

  return EXPRESS_METHOD_IDS.map((methodId) => {
    const row = byId.get(methodId);
    const feeCnyCents = Math.max(0, row?.feeCents ?? 0);
    const deliveryDaysLabel = row?.deliveryDaysLabel?.trim() || "3-5 Business Days";
    return {
      methodId,
      label: EXPRESS_METHOD_TITLES[methodId],
      deliveryDaysLabel,
      feeCnyCents,
      totalUsdCents: convertCnyCentsToUsdCents(feeCnyCents, cnyPerUsd),
      available: feeCnyCents > 0,
    } satisfies ExpressMethodQuote;
  });
}
