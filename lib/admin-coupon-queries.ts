import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminCouponRow = {
  id: string;
  code: string;
  amountOffCents: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  quantity: number;
  usedCount: number;
  homeFeatured: boolean;
};

export type AdminCouponsLoadResult = {
  coupons: AdminCouponRow[];
  homeFeaturedSupported: boolean;
};

export function isHomeFeaturedColumnMissing(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message;
  return (
    message.includes("homeFeatured") ||
    message.includes("HomeFeatured") ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      (message.includes("no such column") || message.includes("SQLITE_ERROR")))
  );
}

/** Lists coupons for admin; falls back when D1 is missing `homeFeatured` migration. */
export async function listAdminCoupons(): Promise<AdminCouponsLoadResult> {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
    return { coupons, homeFeaturedSupported: true };
  } catch (error) {
    if (!isHomeFeaturedColumnMissing(error)) throw error;

    const rows = await prisma.$queryRaw<
      Omit<AdminCouponRow, "homeFeatured">[]
    >`
      SELECT
        id,
        code,
        amountOffCents,
        startsAt,
        endsAt,
        isActive,
        quantity,
        usedCount
      FROM Coupon
      ORDER BY updatedAt DESC, createdAt DESC
    `;

    return {
      coupons: rows.map((row) => ({ ...row, homeFeatured: false })),
      homeFeaturedSupported: false,
    };
  }
}
