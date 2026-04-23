"use client";

import { useMemo } from "react";
import type { CheckoutAddressForm } from "@/lib/checkout-address";
import { CountryCombobox } from "@/components/checkout/country-combobox";
import { CityField } from "@/components/checkout/city-field";
import { PostalCodeField } from "@/components/checkout/postal-code-field";
import { SearchableSelect } from "@/components/checkout/searchable-select";
import {
  hasStrictCityPostcodeChain,
  isPostalRequiredForCheckout,
} from "@/lib/checkout-address-consistency";
import { getAustralianPostcodeOptions } from "@/lib/checkout-au-postcodes";
import { getCheckoutCountryFieldRules } from "@/lib/checkout-country-field-rules";
import {
  getStateProvinceOptionsForCountry,
  isCityRequiredForCountry,
  isStateRequiredForCountry,
} from "@/lib/checkout-state-options";
import {
  caPostalPrimaryCity,
  usZipPrimaryCity,
} from "@/lib/checkout-zipcodes-helpers";
import { countryLabelToIso2 } from "@/lib/logistics-estimate";

export function CheckoutAddressFields({
  title,
  value,
  onChange,
  idPrefix,
}: {
  title: string;
  value: CheckoutAddressForm;
  onChange: (next: CheckoutAddressForm) => void;
  idPrefix: string;
}) {
  function patch<K extends keyof CheckoutAddressForm>(
    key: K,
    v: CheckoutAddressForm[K],
  ) {
    onChange({ ...value, [key]: v });
  }

  const stateOptions = useMemo(
    () => getStateProvinceOptionsForCountry(value.country),
    [value.country],
  );

  const iso2 = useMemo(
    () => countryLabelToIso2(value.country),
    [value.country],
  );
  const fieldRules = useMemo(
    () => getCheckoutCountryFieldRules(value.country),
    [value.country],
  );
  const isAu = iso2 === "AU";
  const cityLineRequired = useMemo(
    () => isCityRequiredForCountry(value.country),
    [value.country],
  );
  const stateRequired = useMemo(
    () => isStateRequiredForCountry(value.country),
    [value.country],
  );

  /** Only AU / US / CA tie postcode suggestions to town/city; UK and others are independent (WooCommerce-style). */
  const postalNeedsCityFirst = useMemo(
    () =>
      Boolean(
        iso2 && hasStrictCityPostcodeChain(iso2, value.state),
      ),
    [iso2, value.state],
  );
  const postalRequired = Boolean(
    iso2 && isPostalRequiredForCheckout(iso2, value.state),
  );
  const postalDisabled =
    (stateRequired && !value.state.trim()) ||
    (postalNeedsCityFirst && !value.city.trim());
  const cityDisabled =
    stateOptions.length > 0 && !value.state.trim();

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-5">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {title}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field
          id={`${idPrefix}-firstName`}
          label="First name"
          required
          autoComplete="given-name"
          value={value.firstName}
          onChange={(v) => patch("firstName", v)}
        />
        <Field
          id={`${idPrefix}-lastName`}
          label="Last name"
          required
          autoComplete="family-name"
          value={value.lastName}
          onChange={(v) => patch("lastName", v)}
        />
        <Field
          id={`${idPrefix}-company`}
          className="sm:col-span-2"
          label="Company name (optional)"
          autoComplete="organization"
          value={value.company}
          onChange={(v) => patch("company", v)}
        />
        <CountryCombobox
          id={`${idPrefix}-country`}
          className="sm:col-span-2"
          label="Country / region"
          required
          value={value.country}
          onChange={(newCountry) => {
            onChange({
              ...value,
              country: newCountry,
              state: "",
              logisticsZone: "",
              postalCode: "",
              city: "",
            });
          }}
        />
        <Field
          id={`${idPrefix}-line1`}
          className="sm:col-span-2"
          label="Street address"
          required
          autoComplete="address-line1"
          value={value.line1}
          onChange={(v) => patch("line1", v)}
        />
        <Field
          id={`${idPrefix}-line2`}
          className="sm:col-span-2"
          label="Apartment, suite, unit, etc. (optional)"
          autoComplete="address-line2"
          value={value.line2}
          onChange={(v) => patch("line2", v)}
        />
        {stateOptions.length > 0 ? (
          <SearchableSelect
            id={`${idPrefix}-state`}
            className="sm:col-span-2"
            label={fieldRules.stateLabel}
            required={stateRequired}
            value={value.state}
            onChange={(v) => {
              if (isAu) {
                const opts = getAustralianPostcodeOptions(v);
                const keepPostal =
                  opts.length > 0 &&
                  opts.some((o) => o.value === value.postalCode);
                onChange({
                  ...value,
                  state: v,
                  postalCode: keepPostal ? value.postalCode : "",
                  city: "",
                });
              } else if (iso2 === "US" || iso2 === "CA") {
                onChange({
                  ...value,
                  state: v,
                  postalCode: "",
                  city: "",
                });
              } else {
                onChange({ ...value, state: v });
              }
            }}
            options={[
              { value: "", label: fieldRules.stateSelectPrompt },
              ...stateOptions,
            ]}
            searchPlaceholder={fieldRules.stateSearchPlaceholder}
          />
        ) : (
          <Field
            id={`${idPrefix}-state`}
            className="sm:col-span-2"
            label={fieldRules.stateLabel}
            required={stateRequired}
            autoComplete="address-level1"
            placeholder={fieldRules.stateManualPlaceholder}
            value={value.state}
            onChange={(v) => {
              if (iso2 === "US" || iso2 === "CA") {
                onChange({ ...value, state: v, postalCode: "", city: "" });
              } else {
                onChange({ ...value, state: v });
              }
            }}
            hint={fieldRules.stateManualHint}
          />
        )}
        <CityField
          id={`${idPrefix}-city`}
          className="sm:col-span-2"
          label="Town / city"
          required={cityLineRequired}
          countryName={value.country}
          stateValue={value.state}
          value={value.city}
          onChange={(v) =>
            onChange(
              postalNeedsCityFirst
                ? { ...value, city: v, postalCode: "" }
                : { ...value, city: v },
            )
          }
          autoComplete="address-level2"
          disabled={cityDisabled}
          searchPlaceholder={fieldRules.citySearchPlaceholder}
          emptyMessage={fieldRules.cityEmptyMessage}
          freeTextHint="Press Enter to use the text you typed"
          hint={fieldRules.cityHint}
        />
        <PostalCodeField
          id={`${idPrefix}-postalCode`}
          className="sm:col-span-2"
          label={fieldRules.postalLabel}
          required={postalRequired}
          countryName={value.country}
          stateValue={value.state}
          cityValue={value.city}
          value={value.postalCode}
          onChange={(v) => {
            if (iso2 === "US" && value.state.trim() && v.trim()) {
              const cityFromZip = usZipPrimaryCity(v, value.state);
              if (cityFromZip) {
                onChange({ ...value, postalCode: v, city: cityFromZip });
                return;
              }
            }
            if (iso2 === "CA" && value.state.trim() && v.trim()) {
              const cityFromPostal = caPostalPrimaryCity(v, value.state);
              if (cityFromPostal) {
                onChange({ ...value, postalCode: v, city: cityFromPostal });
                return;
              }
            }
            onChange({ ...value, postalCode: v });
          }}
          disabled={postalDisabled}
        />
        <Field
          id={`${idPrefix}-phone`}
          label="Phone"
          required
          autoComplete="tel"
          value={value.phone}
          onChange={(v) => patch("phone", v)}
        />
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  className = "",
  required = false,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className={`block ${className}`} htmlFor={id}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
        {required ? (
          <span className="text-rose-600" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </span>
      <input
        id={id}
        type="text"
        name={id}
        autoComplete={autoComplete}
        aria-required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
      />
      {hint ? (
        <span className="mt-1 block text-[11px] leading-snug text-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
