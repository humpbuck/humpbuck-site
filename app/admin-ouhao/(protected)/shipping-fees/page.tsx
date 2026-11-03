import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminExchangeRateCard } from "@/components/admin/admin-exchange-rate-card";
import { AdminFlashMessage } from "@/components/admin/admin-flash-message";
import { ShippingFeeCountrySelect } from "@/components/admin/shipping-fee-country-select";
import { ShippingFeeEditableFields } from "@/components/admin/shipping-fee-row-preview";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import {
  countryNameForShippingRateKey,
  isValidShippingRateKey,
} from "@/lib/shipping-fee-country-options";
import {
  EXPRESS_METHOD_TITLES,
  listExpressShippingMethods,
} from "@/lib/shipping-express-methods";
import { SHIPPING_DEFAULTS, parseNonNegativeNumber } from "@/lib/shipping-fee";
import {
  listShippingFeeRates,
  parseCnyToCents,
  parseDeliveryDaysLabel,
  previewOneWatchShippingCny,
} from "@/lib/shipping-fee-rates";
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

async function createShippingFeeAction(formData: FormData) {
  "use server";
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

async function updateShippingFeeAction(formData: FormData) {
  "use server";
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

async function deleteShippingFeeAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) goShippingFees({ error: "Missing row id." });
  await prisma.shippingFeeRate.delete({ where: { id } });
  revalidateShippingFeeViews();
  goShippingFees({ success: "Country removed." });
}

async function updateExpressShippingAction(formData: FormData) {
  "use server";
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

const countrySelectClass =
  "w-full max-w-[11rem] rounded-lg border border-line bg-paper px-2.5 py-2 text-sm text-ink outline-none ring-ink/20 focus:ring-2";

const inputFeeClass =
  "w-full min-w-24 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2";

const inputDeliveryClass =
  "w-full min-w-40 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2";

const btnPrimaryClass =
  "inline-flex w-full items-center justify-center rounded-lg bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90";

const tableHeadClass =
  "border-b border-line text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted";

const tableWrapClass = "mt-3 overflow-x-auto rounded-2xl border border-line bg-white/60";

export default async function AdminShippingFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await assertAdmin();
  const sp = await searchParams;

  let rates: Awaited<ReturnType<typeof listShippingFeeRates>> = [];
  let expressMethods: Awaited<ReturnType<typeof listExpressShippingMethods>> = [];
  let dbSetupError: string | null = null;
  try {
    [rates, expressMethods] = await Promise.all([
      listShippingFeeRates(),
      listExpressShippingMethods(),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      /no such table|no such column|ShippingExpressMethod|ShippingFeeRate|deliveryDaysLabel|pricePerKg/i.test(
        msg,
      )
    ) {
      dbSetupError =
        "Shipping fee tables need a DB migrate (pricePerKg / deliveryFee / dutyPercent). Run the latest Prisma migration locally, then sync D1 if needed.";
    } else {
      dbSetupError = msg;
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <AdminBackLink />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Shipping fees</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Standard shipping matches WatchSourceGo wholesale / Cainiao OH style:{" "}
            <strong className="font-medium text-ink">
              运费 = ¥/kg × 重量 + 派送费
            </strong>
            ，税费 = (商品 + 运费) × 税费%。Default watch weight is{" "}
            <strong className="font-medium text-ink">{SHIPPING_DEFAULTS.watchWeightKg} kg</strong>.
            Checkout multiplies by cart quantity. Express carriers (DHL / FedEx / UPS) stay fixed
            global fees below.
          </p>
        </div>
        <AdminExchangeRateCard />
      </div>

      {sp.error ? (
        <AdminFlashMessage kind="error" message={sp.error} clearHref={adminPath("/shipping-fees")} />
      ) : null}
      {sp.success ? (
        <AdminFlashMessage
          kind="success"
          message={sp.success}
          clearHref={adminPath("/shipping-fees")}
        />
      ) : null}
      {dbSetupError ? (
        <AdminFlashMessage kind="error" message={dbSetupError} clearHref={adminPath("/shipping-fees")} />
      ) : null}

      <section className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Add country rate
        </h2>
        <div className={tableWrapClass}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className={tableHeadClass}>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">¥/kg</th>
                <th className="px-4 py-3">派送费</th>
                <th className="px-4 py-3">1只表 preview</th>
                <th className="px-4 py-3">税费 %</th>
                <th className="px-4 py-3">Delivery time</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="px-4 py-3 align-top">
                  <form action={createShippingFeeAction} id="shipping-fee-add">
                    <ShippingFeeCountrySelect name="countryCode" className={countrySelectClass} />
                  </form>
                </td>
                <ShippingFeeEditableFields
                  formId="shipping-fee-add"
                  initialPricePerKg={String(SHIPPING_DEFAULTS.pricePerKg)}
                  initialDeliveryFee={String(SHIPPING_DEFAULTS.deliveryFee)}
                  inputClassName={inputFeeClass}
                />
                <td className="px-4 py-3 align-top">
                  <input
                    form="shipping-fee-add"
                    name="dutyPercent"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={String(SHIPPING_DEFAULTS.dutyPercent)}
                    className={inputFeeClass}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    form="shipping-fee-add"
                    name="deliveryDaysLabel"
                    type="text"
                    required
                    placeholder={SHIPPING_DEFAULTS.deliveryTime}
                    defaultValue={SHIPPING_DEFAULTS.deliveryTime}
                    className={inputDeliveryClass}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <button type="submit" form="shipping-fee-add" className={btnPrimaryClass}>
                    Add country
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Standard Shipping — country rates
        </h2>
        <p className="mt-2 text-xs text-muted">
          Preview ignores 税费%. At checkout, duty uses (goods + shipping) × 税费%. Rates should
          come from Cainiao OH (¥/kg = freight tier, 派送费 = registration).
        </p>
        {rates.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-white/60 px-5 py-4 text-sm text-muted">
            No countries configured yet. Add at least one country (and both Australia zones if you
            ship to AU) before customers can choose Standard Shipping. You can also run{" "}
            <code className="rounded bg-paper px-1 py-0.5 text-[11px]">
              npx tsx scripts/sync-shipping-fees-from-oh.ts
            </code>{" "}
            to fill from OH.
          </p>
        ) : (
          <div className={tableWrapClass}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className={tableHeadClass}>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">¥/kg</th>
                  <th className="px-4 py-3">派送费</th>
                  <th className="px-4 py-3">1只表 preview</th>
                  <th className="px-4 py-3">税费 %</th>
                  <th className="px-4 py-3">Delivery time</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => {
                  const pricePerKg = Number(rate.pricePerKg ?? SHIPPING_DEFAULTS.pricePerKg);
                  const deliveryFee = Number(rate.deliveryFee ?? SHIPPING_DEFAULTS.deliveryFee);
                  const dutyPercent = Number(rate.dutyPercent ?? SHIPPING_DEFAULTS.dutyPercent);
                  const formId = `shipping-fee-${rate.id}`;
                  const oneWatch = previewOneWatchShippingCny(pricePerKg, deliveryFee);
                  return (
                    <tr key={rate.id} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-3 align-top">
                        <form action={updateShippingFeeAction} id={formId}>
                          <input type="hidden" name="id" value={rate.id} />
                          <ShippingFeeCountrySelect
                            name="countryCode"
                            defaultValue={rate.countryCode}
                            className={countrySelectClass}
                          />
                          {oneWatch != null ? (
                            <p className="mt-1 text-[11px] text-muted">
                              saved preview ¥{oneWatch.toFixed(2)} @ {SHIPPING_DEFAULTS.watchWeightKg}
                              kg
                            </p>
                          ) : null}
                        </form>
                      </td>
                      <ShippingFeeEditableFields
                        formId={formId}
                        initialPricePerKg={String(pricePerKg)}
                        initialDeliveryFee={String(deliveryFee)}
                        inputClassName={inputFeeClass}
                      />
                      <td className="px-4 py-3 align-top">
                        <input
                          form={formId}
                          name="dutyPercent"
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          defaultValue={String(dutyPercent)}
                          className={inputFeeClass}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <input
                          form={formId}
                          name="deliveryDaysLabel"
                          type="text"
                          required
                          defaultValue={rate.deliveryDaysLabel || SHIPPING_DEFAULTS.deliveryTime}
                          className={inputDeliveryClass}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex min-w-28 flex-col gap-2">
                          <button type="submit" form={formId} className={btnPrimaryClass}>
                            Save
                          </button>
                          <button
                            type="submit"
                            formAction={deleteShippingFeeAction}
                            form={formId}
                            className="inline-flex items-center justify-center rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-800 transition hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Express shipping (fixed)
        </h2>
        <div className={`${tableWrapClass} mt-3`}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className={tableHeadClass}>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Fee (¥)</th>
                <th className="px-4 py-3">Delivery time</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expressMethods.map((method) => (
                <tr key={method.methodId} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3 align-middle font-medium text-ink">
                    {EXPRESS_METHOD_TITLES[method.methodId as keyof typeof EXPRESS_METHOD_TITLES] ??
                      method.methodId}
                    <form action={updateExpressShippingAction} id={`express-${method.methodId}`}>
                      <input type="hidden" name="methodId" value={method.methodId} />
                    </form>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      form={`express-${method.methodId}`}
                      name="feeCny"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      defaultValue={(method.feeCents / 100).toFixed(2)}
                      className={inputFeeClass}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      form={`express-${method.methodId}`}
                      name="deliveryDaysLabel"
                      type="text"
                      required
                      defaultValue={method.deliveryDaysLabel || "3-5 Business Days"}
                      className={inputDeliveryClass}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      type="submit"
                      form={`express-${method.methodId}`}
                      className={btnPrimaryClass}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
