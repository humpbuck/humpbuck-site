"use client";

import {
  adminStatusMeta,
  adminStatusPillClass,
} from "@/lib/admin/order-ui";

export function OrderStatusBadge({ status }: { status: string }) {
  const { label, tone } = adminStatusMeta(status);
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-tight ring-1 ${adminStatusPillClass(tone)}`}
    >
      {label}
    </span>
  );
}
