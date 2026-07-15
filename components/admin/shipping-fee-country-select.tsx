import {
  countryNameForShippingRateKey,
  isValidShippingRateKey,
  listShippingFeeCountryOptions,
} from "@/lib/shipping-fee-country-options";

type Props = {
  name: string;
  defaultValue?: string;
  className?: string;
};

export function ShippingFeeCountrySelect({ name, defaultValue, className }: Props) {
  const options = listShippingFeeCountryOptions();
  const selected = defaultValue?.trim().toUpperCase() ?? "";

  return (
    <select
      name={name}
      required
      defaultValue={selected}
      className={
        className ??
        "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
      }
    >
      <option value="" disabled>
        Select country / region
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {selected && !options.some((option) => option.value === selected) && isValidShippingRateKey(selected) ? (
        <option value={selected}>{countryNameForShippingRateKey(selected)}</option>
      ) : null}
    </select>
  );
}
