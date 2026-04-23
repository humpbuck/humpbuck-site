"use client";

import { useCallback, useMemo, useRef } from "react";
import { countryLabelToIso2 } from "@/lib/logistics-estimate";
import { AsyncSearchableSelect } from "@/components/checkout/async-searchable-select";

export function CityField({
  id,
  countryName,
  stateValue,
  value,
  onChange,
  required = true,
  className = "",
  disabled = false,
  label = "Town / city",
  searchPlaceholder = "Search or type city…",
  emptyMessage = "Type to search or enter your city",
  freeTextHint = "Press Enter to apply, or × to clear.",
  hint,
  autoComplete = "address-level2",
}: {
  id: string;
  countryName: string;
  stateValue: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  label?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  freeTextHint?: string;
  hint?: string;
  autoComplete?: string;
}) {
  const iso2 = useMemo(
    () => countryLabelToIso2(countryName) ?? "",
    [countryName],
  );
  const fieldBoundaryRef = useRef<HTMLDivElement>(null);

  const loadOptions = useCallback(
    async (q: string) => {
      const sp = new URLSearchParams({ iso2, state: stateValue, q });
      const res = await fetch(`/api/checkout/cities?${sp.toString()}`, {
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
    [iso2, stateValue],
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
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        freeText
        freeTextHint={freeTextHint}
        disabled={disabled}
        outsideBoundaryRef={fieldBoundaryRef}
        autoComplete={autoComplete}
      />
      {hint ? (
        <span className="mt-1 block text-[11px] leading-snug text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
