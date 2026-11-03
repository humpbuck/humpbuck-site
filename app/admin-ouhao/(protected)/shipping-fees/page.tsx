import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminExchangeRateCard } from "@/components/admin/admin-exchange-rate-card";
import { AdminFlashMessage } from "@/components/admin/admin-flash-message";
import {
  ShippingFeesStandardPanel,
  type ShippingFeeRateRow,
} from "@/components/admin/shipping-fees-standard-panel";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import {
  EXPRESS_METHOD_TITLES,
  listExpressShippingMethods,
} from "@/lib/shipping-express-methods";
import { SHIPPING_DEFAULTS } from "@/lib/shipping-fee";
import { listShippingFeeRates } from "@/lib/shipping-fee-rates";
import {
  createShippingFeeAction,
  deleteShippingFeeAction,
  updateExpressShippingAction,
  updateShippingFeeAction,
} from "./actions";

const inputFeeClass =
  "h-10 w-full min-w-24 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none ring-ink/20 focus:ring-2";

const inputDeliveryClass =
  "h-10 w-full min-w-40 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none ring-ink/20 focus:ring-2";

const btnPrimaryClass =
  "inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90";

const tableHeadClass =
  "border-b border-line text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted";

const tableWrapClass = "mt-3 overflow-x-auto rounded-2xl border border-line bg-white";

export default async function AdminShippingFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await assertAdmin();
  const sp = await searchParams;

  let rates: ShippingFeeRateRow[] = [];
  let expressMethods: Awaited<ReturnType<typeof listExpressShippingMethods>> = [];
  let dbSetupError: string | null = null;
  try {
    const [rawRates, methods] = await Promise.all([
      listShippingFeeRates(),
      listExpressShippingMethods(),
    ]);
    expressMethods = methods;
    rates = rawRates.map((rate) => ({
      id: rate.id,
      countryCode: rate.countryCode,
      countryName: rate.countryName,
      pricePerKg: Number(rate.pricePerKg ?? SHIPPING_DEFAULTS.pricePerKg),
      deliveryFee: Number(rate.deliveryFee ?? SHIPPING_DEFAULTS.deliveryFee),
      dutyPercent: Number(rate.dutyPercent ?? SHIPPING_DEFAULTS.dutyPercent),
      deliveryDaysLabel: rate.deliveryDaysLabel || SHIPPING_DEFAULTS.deliveryTime,
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      /no such table|no such column|ShippingExpressMethod|ShippingFeeRate|deliveryDaysLabel|pricePerKg/i.test(
        msg,
      )
    ) {
      dbSetupError =
        "Shipping fee tables need a DB migrate (pricePerKg / deliveryFee / dutyPercent). Run: npm run db:d1:remote  then  npx tsx scripts/sync-shipping-fees-from-oh.ts --target=d1-remote  (must use humpbuck Cloudflare account).";
    } else {
      dbSetupError = msg;
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <AdminBackLink href={adminPath()} label="Overview" />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">运费</p>
          <h1 className="mt-2 font-serif text-3xl text-ink">Shipping fees</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Standard shipping matches WatchSourceGo wholesale / Cainiao OH: most countries use{" "}
            <strong className="font-medium text-ink">运费 = ¥/kg × 重量 + 派送费</strong>
            ；日本 / 哈萨克斯坦等 OH 首重续重按重量档计算（件数越多可能越高）。税费 = (商品 + 运费) ×
            税费%。Default watch weight is{" "}
            <strong className="font-medium text-ink">{SHIPPING_DEFAULTS.watchWeightKg} kg</strong>
            . Express carriers (DHL / FedEx / UPS) stay fixed global fees below.
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

      <ShippingFeesStandardPanel
        rates={rates}
        createAction={createShippingFeeAction}
        updateAction={updateShippingFeeAction}
        deleteAction={deleteShippingFeeAction}
      />

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
