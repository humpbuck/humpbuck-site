"use client";

import { useMemo, useState } from "react";
import { quoteCheckoutShipping } from "@/lib/checkout-shipping-quote";

const COUNTRIES = [
  "AE","AL","AO","AR","AT","AU","BE","BG","BH","BO","BR","CA","CH","CL","CO","CR","CY","CZ","DE","DK","DO","EC","EE","ES","FI","FR","GB","GH","GR","GT","HK","HN","HR","HU","IE","IL","IN","IQ","IS","IT","JO","JP","KE","KR","KW","KZ","LK","LT","LU","LV","MA","MD","MN","MT","MX","MY","NG","NI","NL","NO","NZ","OM","PA","PE","PH","PL","PR","PT","PY","QA","RO","RS","RU","RW","SA","SE","SG","SI","SK","SV","TH","TT","TZ","UA","UG","US","UY","VN","ZA","CN",
] as const;

type MethodKey = "OH" | "YANWEN_484";
type ViewMode = "all" | "available" | MethodKey;
type ZoneCheckRow = { country: string; label: string; state?: string; postalCode?: string };

const ZONE_CHECK_ROWS: ZoneCheckRow[] = [
  { country: "AU", label: "AU Zone 1", postalCode: "2000" },
  { country: "AU", label: "AU Zone 2", postalCode: "2100" },
  { country: "AU", label: "AU Zone 3", postalCode: "7000" },
  { country: "AU", label: "AU Zone 4", postalCode: "800" },
  { country: "MY", label: "MY West", state: "Selangor" },
  { country: "MY", label: "MY East", state: "Sabah" },
  { country: "PH", label: "PH Metro Manila", state: "Metro Manila", postalCode: "1000" },
  { country: "PH", label: "PH Other", state: "Cebu", postalCode: "6000" },
];

function money(v: number | null) {
  if (v == null) return "-";
  return `¥${v.toFixed(2)}`;
}

function methodTitle(key: MethodKey) {
  return key === "YANWEN_484" ? "Yanwen 484" : key;
}

export default function ShippingRulesAuditPage() {
  const [filter, setFilter] = useState("");
  const weightKg = "0.2";
  const viewMode = "all" as ViewMode;

  const parsedWeight = Number(weightKg);
  const effectiveWeightKg = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 0.2;
  const units = Math.max(1, Math.round(effectiveWeightKg / 0.2));

  const rows = useMemo(
    () =>
      COUNTRIES.map((country) => {
        const oh = quoteCheckoutShipping({ countryLabel: country, totalUnits: units, method: "cainiao", state: null, postalCode: null });
        const yw = quoteCheckoutShipping({ countryLabel: country, totalUnits: units, method: "yanwen", state: null, postalCode: null });
        return {
          country,
          OH: oh.ok ? { available: true, totalRMB: oh.shippingCny, topUpRMB: Math.max(0, oh.shippingCny - 50), baseRMB: oh.shippingCny, extraRMB: 0, domesticRMB: 0 } : { available: false, totalRMB: null, topUpRMB: null, baseRMB: null, extraRMB: null, domesticRMB: null },
          YANWEN_484: yw.ok ? { available: true, totalRMB: yw.shippingCny, topUpRMB: Math.max(0, yw.shippingCny - 50), baseRMB: yw.shippingCny, extraRMB: 0, domesticRMB: 5 } : { available: false, totalRMB: null, topUpRMB: null, baseRMB: null, extraRMB: null, domesticRMB: null },
        };
      }),
    [units],
  );

  const filteredRows = useMemo(() => {
    const q = filter.trim().toUpperCase();
    let next = q ? rows.filter((row) => row.country.includes(q)) : rows;
    if (viewMode === "available") {
      next = next.filter((row) => row.OH.available || row.YANWEN_484.available);
    } else if (viewMode !== "all") {
      next = next.filter((row) => row[viewMode].available);
    }
    return next;
  }, [filter, rows, viewMode]);

  const zoneRows = useMemo(() => {
    return ZONE_CHECK_ROWS.map((z) => {
      const oh = quoteCheckoutShipping({ countryLabel: z.country, totalUnits: units, method: "cainiao", state: z.state ?? null, postalCode: z.postalCode ?? null });
      return {
        ...z,
        zone: oh.ok ? (oh.lineLabel ?? "-") : "-",
        oh: oh.ok ? { available: true, baseRMB: oh.shippingCny, extraRMB: 0, domesticRMB: 0, totalRMB: oh.shippingCny, topUpRMB: Math.max(0, oh.shippingCny - 50) } : { available: false, baseRMB: null, extraRMB: null, domesticRMB: null, totalRMB: null, topUpRMB: null },
      };
    });
  }, [units]);

  const methods: MethodKey[] = ["OH", "YANWEN_484"];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Shipping Rules Audit</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <label className="text-sm font-medium text-zinc-700" htmlFor="country-filter">Filter CountryCode</label>
        <input
          id="country-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="e.g. AU"
          className="w-40 rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
        />
      </div>

      <p className="mt-2 text-sm text-zinc-600">支持按重量和线路筛选，对账更快。</p>

      <div className="mt-6">
        <div className="mb-3 text-sm font-semibold text-zinc-700">Country Coverage Matrix</div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRows.map((row) => {
            const cells = methods.map((method) => {
              const r = row[method];
              const tone =
                method === "OH"
                  ? "border-emerald-200 bg-emerald-50/70"
                  : method === "YANWEN_484"
                    ? "border-sky-200 bg-sky-50/70"
                    : "border-amber-200 bg-amber-50/70";
              return (
                <div key={`${row.country}-${method}`} className={`rounded-2xl border p-3 ${tone}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700">{methodTitle(method)}</span>
                    <span className="text-xs text-zinc-600">{r.available ? "Yes" : "No"}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-700">
                    <div>Base</div>
                    <div className="text-right font-medium">{money(r.baseRMB)}</div>
                    <div>Extra</div>
                    <div className="text-right font-medium">{money(r.extraRMB)}</div>
                    <div>Domestic</div>
                    <div className="text-right font-medium">{money(r.domesticRMB)}</div>
                    <div>Total</div>
                    <div className="text-right font-medium">{money(r.totalRMB)}</div>
                    <div>TopUp</div>
                    <div className="text-right font-medium">{money(r.topUpRMB)}</div>
                  </div>
                </div>
              );
            });

            return (
              <section key={row.country} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-zinc-900">{row.country}</h3>
                  <span className="text-xs text-zinc-500">{effectiveWeightKg.toFixed(2)}kg</span>
                </div>
                <div className="grid gap-2">{cells}</div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">OH Zone Checks</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-700">
              <tr>
                <th className="px-3 py-2 text-left">Test</th>
                <th className="px-3 py-2 text-left">Resolved Zone</th>
                <th className="px-3 py-2 text-left">Base</th>
                <th className="px-3 py-2 text-left">Extra</th>
                <th className="px-3 py-2 text-left">Domestic</th>
                <th className="px-3 py-2 text-left">Total</th>
                <th className="px-3 py-2 text-left">TopUp</th>
              </tr>
            </thead>
            <tbody>
              {zoneRows.map((r) => {
                const tone = r.country === "AU" ? "bg-emerald-50/70" : r.country === "MY" ? "bg-amber-50/70" : "bg-sky-50/70";
                return (
                  <tr key={r.label} className={`border-t border-zinc-100 ${tone}`}>
                    <td className="px-3 py-2 font-medium text-zinc-900">{r.label}</td>
                    <td className="px-3 py-2">{r.zone}</td>
                    <td className="px-3 py-2">{money(r.oh.baseRMB)}</td>
                    <td className="px-3 py-2">{money(r.oh.extraRMB)}</td>
                    <td className="px-3 py-2">{money(r.oh.domesticRMB)}</td>
                    <td className="px-3 py-2">{money(r.oh.totalRMB)}</td>
                    <td className="px-3 py-2">{money(r.oh.topUpRMB)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
        <p className="font-medium">说明</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700">
          <li>OH 线路与 Yanwen 484 现在是主线路。</li>
          <li>Yanwen 的 Domestic ¥5 仅用于商家成本与对账，客户只看 TopUp。</li>
          <li>TopUp = max(0, Total - ¥50).</li>
          <li>OH 分区测试行用于核对 AU / MY / PH 的解析是否命中正确分区。</li>
        </ul>
      </div>
    </main>
  );
}
