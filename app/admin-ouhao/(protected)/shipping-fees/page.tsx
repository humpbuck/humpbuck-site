import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminExchangeRateCard } from "@/components/admin/admin-exchange-rate-card";
import { AdminFlashMessage } from "@/components/admin/admin-flash-message";
import { ShippingFeeCountrySelect } from "@/components/admin/shipping-fee-country-select";
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
import {
  listShippingFeeRates,
  parseCnyToCents,
  parseDeliveryDaysLabel,
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
  const shippingFeeCents = parseCnyToCents(formData.get("shippingFeeCny"));
  const surchargeCents = parseCnyToCents(formData.get("surchargeCny"));
  const deliveryDaysLabel = parseDeliveryDaysLabel(formData.get("deliveryDaysLabel"));

  if (!countryCode) goShippingFees({ error: "Please select a country or Australia zone." });
  if (shippingFeeCents === null || surchargeCents === null) {
    goShippingFees({ error: "Shipping fee and duty must be zero or greater." });
  }

  try {
    await prisma.shippingFeeRate.create({
      data: {
        countryCode,
        countryName: countryNameForShippingRateKey(countryCode),
        shippingFeeCents,
        surchargeCents,
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
  const shippingFeeCents = parseCnyToCents(formData.get("shippingFeeCny"));
  const surchargeCents = parseCnyToCents(formData.get("surchargeCny"));
  const deliveryDaysLabel = parseDeliveryDaysLabel(formData.get("deliveryDaysLabel"));

  if (!id) goShippingFees({ error: "Missing row id." });
  if (!countryCode) goShippingFees({ error: "Please select a country or Australia zone." });
  if (shippingFeeCents === null || surchargeCents === null) {
    goShippingFees({ error: "Shipping fee and duty must be zero or greater." });
  }

  try {
    await prisma.shippingFeeRate.update({
      where: { id },
      data: {
        countryCode,
        countryName: countryNameForShippingRateKey(countryCode),
        shippingFeeCents,
        surchargeCents,
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
  "w-full min-w-28 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2";

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
    const message = e instanceof Error ? e.message : "Database error";
    const schemaMissing =
      /no such table|no such column|ShippingExpressMethod|ShippingFeeRate|deliveryDaysLabel/i.test(
        message,
      );
    dbSetupError = schemaMissing
      ? "Shipping database tables are not on production D1 yet. Run: npm run db:d1:remote:shipping (requires wrangler login), then reload this page."
      : message;
  }

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <h1 className="font-serif text-3xl tracking-tight">Shipping fee</h1>
        <div className="w-full shrink-0 lg:max-w-sm">
          <AdminExchangeRateCard />
        </div>
      </div>

      {sp.error ? (
        <AdminFlashMessage kind="error" message={sp.error} clearHref={adminPath("/shipping-fees")} />
      ) : null}
      {sp.success ? (
        <AdminFlashMessage kind="success" message={sp.success} clearHref={adminPath("/shipping-fees")} />
      ) : null}
      {dbSetupError ? (
        <AdminFlashMessage kind="error" message={dbSetupError} clearHref={adminPath("/shipping-fees")} />
      ) : null}

      {!dbSetupError ? (
      <section className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Standard Shipping — add country
        </h2>
        <p className="mt-2 text-sm text-muted">
          Country rows below apply to <strong className="font-medium text-ink">Standard Shipping</strong> only.
          Express carriers (DHL / FedEx / UPS) use fixed global fees in the next section.
        </p>
        <div className={tableWrapClass}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className={tableHeadClass}>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Shipping fee (¥)</th>
                <th className="px-4 py-3">Duty (¥)</th>
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
                <td className="px-4 py-3 align-top">
                  <input
                    form="shipping-fee-add"
                    name="shippingFeeCny"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    defaultValue="0"
                    className={inputFeeClass}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    form="shipping-fee-add"
                    name="surchargeCny"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    defaultValue="0"
                    className={inputFeeClass}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    form="shipping-fee-add"
                    name="deliveryDaysLabel"
                    type="text"
                    required
                    placeholder="7-14 Business Days"
                    defaultValue="7-14 Business Days"
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
        {rates.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-white/60 px-5 py-4 text-sm text-muted">
            No countries configured yet. Add at least one country (and both Australia zones if you ship to AU) before customers can choose Standard Shipping.
          </p>
        ) : (
          <div className={tableWrapClass}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className={tableHeadClass}>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Shipping fee (¥)</th>
                  <th className="px-4 py-3">Duty (¥)</th>
                  <th className="px-4 py-3">Delivery time</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3 align-top">
                      <form action={updateShippingFeeAction} id={`shipping-fee-${rate.id}`}>
                        <input type="hidden" name="id" value={rate.id} />
                        <ShippingFeeCountrySelect
                          name="countryCode"
                          defaultValue={rate.countryCode}
                          className={countrySelectClass}
                        />
                      </form>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        form={`shipping-fee-${rate.id}`}
                        name="shippingFeeCny"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={(rate.shippingFeeCents / 100).toFixed(2)}
                        className={inputFeeClass}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        form={`shipping-fee-${rate.id}`}
                        name="surchargeCny"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={(rate.surchargeCents / 100).toFixed(2)}
                        className={inputFeeClass}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        form={`shipping-fee-${rate.id}`}
                        name="deliveryDaysLabel"
                        type="text"
                        required
                        defaultValue={rate.deliveryDaysLabel || "7-14 Business Days"}
                        className={inputDeliveryClass}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex min-w-28 flex-col gap-2">
                        <button
                          type="submit"
                          form={`shipping-fee-${rate.id}`}
                          className={btnPrimaryClass}
                        >
                          Save
                        </button>
                        <button
                          type="submit"
                          formAction={deleteShippingFeeAction}
                          form={`shipping-fee-${rate.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-800 transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Express shipping (global)
        </h2>
        <p className="mt-2 text-sm text-muted">
          Fixed fees for DHL, FedEx, and UPS. Shown to all countries when fee is greater than zero.
        </p>
        <div className={tableWrapClass}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className={tableHeadClass}>
                <th className="px-4 py-3">Carrier</th>
                <th className="px-4 py-3">Fee (¥)</th>
                <th className="px-4 py-3">Delivery time</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expressMethods.map((method) => {
                const title = EXPRESS_METHOD_TITLES[method.methodId as keyof typeof EXPRESS_METHOD_TITLES];
                return (
                  <tr key={method.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3 align-top">
                      <form action={updateExpressShippingAction} id={`express-${method.methodId}`}>
                        <input type="hidden" name="methodId" value={method.methodId} />
                        <div className="max-w-[11rem] text-sm font-medium text-ink">{title}</div>
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
                      <button type="submit" form={`express-${method.methodId}`} className={btnPrimaryClass}>
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}
    </div>
  );
}
