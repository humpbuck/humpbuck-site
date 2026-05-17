import { getTranslations } from "next-intl/server";
import type { BuyerAddressFieldRow } from "@/lib/account-buyer-order";

export async function BuyerAddressFieldTable({
  rows,
}: {
  rows: BuyerAddressFieldRow[];
}) {
  const t = await getTranslations("Account");
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-muted">{t("addressTableEmpty")}</p>;
  }

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[280px] text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted">
              {t("addressTableFieldName")}
            </th>
            <th className="py-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {t("addressTableContent")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-line/70">
              <td className="py-2.5 pr-4 align-top font-medium text-muted">
                {row.label}
              </td>
              <td className="py-2.5 align-top text-ink/90">
                {row.href ? (
                  <a
                    href={row.href}
                    className="text-sky-700 underline-offset-2 hover:underline"
                  >
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
