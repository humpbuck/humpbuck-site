"use client";

import { useCallback, useMemo, useRef } from "react";
import { countryLabelToIso2 } from "@/lib/logistics-estimate";
import {
  POSTAL_NOT_APPLICABLE_SENTINEL,
  allowsPostalNotApplicable,
} from "@/lib/checkout-address-consistency";
import { getCheckoutCountryFieldRules } from "@/lib/checkout-country-field-rules";
import { AsyncSearchableSelect } from "@/components/checkout/async-searchable-select";

export function PostalCodeField({
  id,
  countryName,
  stateValue,
  cityValue,
  value,
  onChange,
  required = true,
  className = "",
  disabled = false,
  label = "Postal code",
}: {
  id: string;
  countryName: string;
  stateValue: string;
  cityValue: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
  /** True until state is chosen where required for postcodes API. */
  disabled?: boolean;
  label?: string;
}) {
  const iso2 = useMemo(
    () => countryLabelToIso2(countryName) ?? "",
    [countryName],
  );
  const fieldRules = useMemo(
    () => getCheckoutCountryFieldRules(countryName),
    [countryName],
  );

  const showNotApplicable = allowsPostalNotApplicable(iso2);
  const fieldBoundaryRef = useRef<HTMLDivElement>(null);

  const loadOptions = useCallback(
    async (q: string) => {
      const sp = new URLSearchParams({
        iso2,
        state: stateValue,
        city: cityValue,
        q,
      });
      const res = await fetch(`/api/checkout/postcodes?${sp.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        return { options: [], freeText: true };
      }
      return (await res.json()) as {
        options: { value: string; label: string }[];
        freeText?: boolean;
        hint?: string;
      };
    },
    [iso2, stateValue, cityValue],
  );

  return (
    <div ref={fieldBoundaryRef} className={className}>
      <AsyncSearchableSelect
        id={id}
        label={label}
        required={required}
        value={value}
        onChange={onChange}
        loadOptions={loadOptions}
        searchPlaceholder={fieldRules.postalSearchPlaceholder}
        emptyMessage={fieldRules.postalEmptyMessage}
        freeText
        freeTextHint="Press Enter to apply what you typed, or use the × button to clear."
        disabled={disabled}
        outsideBoundaryRef={fieldBoundaryRef}
        autoComplete="postal-code"
      />
      {showNotApplicable && !disabled ? (
        <p className="mt-2 text-[11px] leading-snug text-muted">
          <button
            type="button"
            className="font-medium text-ink underline-offset-2 hover:underline"
            onClick={() => onChange(POSTAL_NOT_APPLICABLE_SENTINEL)}
          >
            No postal code for this address
          </button>
          <span className="text-muted">
            {" "}
            — {fieldRules.postalNoCodeHint}
          </span>
        </p>
      ) : null}
    </div>
  );
}
