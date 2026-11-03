"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import {
  countryNameForShippingRateKey,
  isValidShippingRateKey,
} from "@/lib/shipping-fee-country-options";
import {
  EXPRESS_METHOD_TITLES,
} from "@/lib/shipping-express-methods";
import { parseNonNegativeNumber } from "@/lib/shipping-fee";
import { parseCnyToCents, parseDeliveryDaysLabel } from "@/lib/shipping-fee-rates";
import { prisma } from "@/lib/prisma";

function goShippingFees(params?: { error?: string; success?: string }): never {
  const error = params?.error?.trim();
  const success = params?.success?.trim();
  if (!error && !success) {
    redirect(adminPath("/shipping-fees"));
  }
  const qs = new URLSearchParams();
  if (error) qs.set("error", error);
  if (success) qs.set("success", success);
  redirect(`${adminPath("/shipping-fees")}?${qs.toString()}`);
}

function revalidateShippingFeeViews(): void {
  revalidatePath(adminPath("/shipping-fees"));
}

function parseRateKey(raw: FormDataEntryValue | null): string | null {
  const key = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (!isValidShippingRateKey(key)) return null;
  return key;
}

export async function createShippingFeeAction(formData: FormData) {
  await assertAdmin();

  const countryCode = parseRateKey(formData.get("countryCode"));
  const pricePerKg = parseNonNegativeNumber(formData.get("pricePerKg"));
  const deliveryFee = parseNonNegativeNumber(formData.get("deliveryFee"));
  const dutyPercent = parseNonNegativeNumber(formData.get("dutyPercent"));
  const deliveryDaysLabel = parseDeliveryDaysLabel(formData.get("deliveryDaysLabel"));

  if (!countryCode) goShippingFees({ error: "Please select a country or Australia zone." });
  if (pricePerKg === null || deliveryFee === null || dutyPercent === null) {
    goShippingFees({ error: "¥/kg, 派送费, and 税费% must be zero or greater." });
  }

  try {
    await prisma.shippingFeeRate.create({
      data: {
        countryCode,
        countryName: countryNameForShippingRateKey(countryCode),
        pricePerKg,
        deliveryFee,
        dutyPercent,
        deliveryDaysLabel,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create shipping fee row.";
    goShippingFees({
      error: msg.includes("ShippingFeeRate_countryCode_key")
        ? "This country or zone already exists. Edit the existing row instead."
        : msg,
    });
  }

  revalidateShippingFeeViews();
  goShippingFees({ success: "Country shipping fee added." });
}

export async function updateShippingFeeAction(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const countryCode = parseRateKey(formData.get("countryCode"));
  const pricePerKg = parseNonNegativeNumber(formData.get("pricePerKg"));
  const deliveryFee = parseNonNegativeNumber(formData.get("deliveryFee"));
  const dutyPercent = parseNonNegativeNumber(formData.get("dutyPercent"));
  const deliveryDaysLabel = parseDeliveryDaysLabel(formData.get("deliveryDaysLabel"));

  if (!id) goShippingFees({ error: "Missing row id." });
  if (!countryCode) goShippingFees({ error: "Please select a country or Australia zone." });
  if (pricePerKg === null || deliveryFee === null || dutyPercent === null) {
    goShippingFees({ error: "¥/kg, 派送费, and 税费% must be zero or greater." });
  }

  try {
    await prisma.shippingFeeRate.update({
      where: { id },
      data: {
        countryCode,
        countryName: countryNameForShippingRateKey(countryCode),
        pricePerKg,
        deliveryFee,
        dutyPercent,
        deliveryDaysLabel,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update shipping fee row.";
    goShippingFees({
      error: msg.includes("ShippingFeeRate_countryCode_key")
        ? "Another row already uses this country or zone."
        : msg,
    });
  }

  revalidateShippingFeeViews();
  goShippingFees({ success: "Shipping fee saved." });
}

export async function deleteShippingFeeAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) goShippingFees({ error: "Missing row id." });
  await prisma.shippingFeeRate.delete({ where: { id } });
  revalidateShippingFeeViews();
  goShippingFees({ success: "Country removed." });
}

export async function updateExpressShippingAction(formData: FormData) {
  await assertAdmin();

  const methodId = String(formData.get("methodId") ?? "").trim().toLowerCase();
  const feeCents = parseCnyToCents(formData.get("feeCny"));
  const deliveryDaysLabel = parseDeliveryDaysLabel(formData.get("deliveryDaysLabel"));

  if (!methodId || !(methodId in EXPRESS_METHOD_TITLES)) {
    goShippingFees({ error: "Invalid express shipping method." });
  }
  if (feeCents === null) goShippingFees({ error: "Express fee must be zero or greater." });

  await prisma.shippingExpressMethod.update({
    where: { methodId },
    data: { feeCents, deliveryDaysLabel },
  });

  revalidateShippingFeeViews();
  goShippingFees({ success: "Express shipping saved." });
}
