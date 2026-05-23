"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Country, State, City } from "country-state-city";
import type { CheckoutAddressForm as CheckoutAddressFormValue } from "@/lib/checkout-address";
import { validateCheckoutPostalCode } from "@/lib/checkout-postal-validation";
import { SPECIAL_CITY_OPTIONS } from "@/lib/special-city-options";
import { getTaxIdRule } from "@/lib/tax-id-rules";

const DEFAULT_COUNTRY = "US";
const COUNTRY_LABELS = new Intl.DisplayNames(["en"], { type: "region" });
const DIAL_CODE_OPTIONS = [
  "+1", "+7", "+20", "+27", "+30", "+31", "+32", "+33", "+34", "+36", "+39", "+40", "+41", "+43", "+44", "+45", "+46", "+47", "+48", "+49", "+51", "+52", "+53", "+54", "+55", "+56", "+57", "+58", "+60", "+61", "+62", "+63", "+64", "+65", "+66", "+81", "+82", "+84", "+86", "+90", "+91", "+92", "+93", "+94", "+95", "+98", "+211", "+212", "+213", "+216", "+218", "+220", "+221", "+222", "+223", "+224", "+225", "+226", "+227", "+228", "+229", "+230", "+231", "+232", "+233", "+234", "+235", "+236", "+237", "+238", "+239", "+240", "+241", "+242", "+243", "+244", "+245", "+246", "+247", "+248", "+249", "+250", "+251", "+252", "+253", "+254", "+255", "+256", "+257", "+258", "+260", "+261", "+262", "+263", "+264", "+265", "+266", "+267", "+268", "+269", "+290", "+291", "+297", "+298", "+299", "+350", "+351", "+352", "+353", "+354", "+355", "+356", "+357", "+358", "+359", "+370", "+371", "+372", "+373", "+374", "+375", "+376", "+377", "+378", "+380", "+381", "+382", "+383", "+385", "+386", "+387", "+389", "+420", "+421", "+423", "+500", "+501", "+502", "+503", "+504", "+505", "+506", "+507", "+508", "+509", "+590", "+591", "+592", "+593", "+594", "+595", "+596", "+597", "+598", "+599", "+670", "+672", "+673", "+674", "+675", "+676", "+677", "+678", "+679", "+680", "+681", "+682", "+683", "+685", "+686", "+687", "+688", "+689", "+690", "+691", "+692", "+850", "+852", "+853", "+855", "+856", "+880", "+886", "+960", "+961", "+962", "+963", "+964", "+965", "+966", "+967", "+968", "+970", "+971", "+972", "+973", "+974", "+975", "+976", "+977", "+992", "+993", "+994", "+995", "+996", "+998",
];
const DIAL_CODE_LABELS = DIAL_CODE_OPTIONS
  .map((code) => ({ code, label: code }))
  .sort((a, b) => {
    const aDigits = a.code.slice(1);
    const bDigits = b.code.slice(1);
    const prefixCompare = aDigits[0].localeCompare(bDigits[0], "en");
    if (prefixCompare !== 0) return prefixCompare;
    const numericCompare = aDigits.localeCompare(bDigits, "en", { numeric: true });
    if (numericCompare !== 0) return numericCompare;
    return aDigits.length - bDigits.length;
  });

function parsePhoneValue(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return { dialCode: "+1", nationalNumber: "" };
  const matched = DIAL_CODE_OPTIONS.filter((code) => trimmed.startsWith(code)).sort((a, b) => b.length - a.length)[0];
  if (!matched) return { dialCode: "+1", nationalNumber: trimmed };
  return { dialCode: matched, nationalNumber: trimmed.slice(matched.length).trimStart() };
}

function formatPhoneValue(dialCode: string, nationalNumber: string) {
  const code = dialCode.trim().startsWith("+") ? dialCode.trim() : `+${dialCode.trim().replace(/\D+/g, "")}`;
  const num = nationalNumber.replace(/\D+/g, "");
  return num ? `${code}${num}` : code;
}

function countryLabel(iso2: string) {
  return COUNTRY_LABELS.of(iso2) ?? iso2;
}

function normalizeCountryText(text: string) {
  return text.trim().toLowerCase();
}

export function CheckoutAddressForm({
  title,
  value,
  onChange,
  idPrefix,
}: {
  title: string;
  value: CheckoutAddressFormValue;
  onChange: (next: CheckoutAddressFormValue) => void;
  idPrefix: string;
}) {
  const t = useTranslations("CheckoutAddress");
  const tTax = useTranslations("TaxId");
  const initialPhone = parsePhoneValue(value.phone);
  const initialCountryIso2 = useMemo(
    () => Country.getAllCountries().find((item) => item.name === value.country || item.isoCode === value.country)?.isoCode || DEFAULT_COUNTRY,
    [value.country],
  );

  const defaultCountryText = useMemo(
    () => `${countryLabel(initialCountryIso2)} (${initialCountryIso2})`,
    [initialCountryIso2],
  );

  const countries = useMemo(
    () => Country.getAllCountries().map((item) => ({ iso2: item.isoCode, label: item.name })).sort((a, b) => a.label.localeCompare(b.label, "en")),
    [],
  );

  const [countryIso2, setCountryIso2] = useState(initialCountryIso2);
  const [stateCode, setStateCode] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.nationalNumber);

  const [phoneCodeCommitted, setPhoneCodeCommitted] = useState(initialPhone.dialCode);
  const [countryText, setCountryText] = useState(defaultCountryText);
  const [, setCountryCommitted] = useState(defaultCountryText);
  const [stateText, setStateText] = useState(value.state || "");
  const [, setStateCommitted] = useState(value.state || "");
  const [cityText, setCityText] = useState(value.city || "");
  const [, setCityCommitted] = useState(value.city || "");
  const countryRestoreRef = useRef(defaultCountryText);
  const stateRestoreRef = useRef(value.state || "");
  const cityRestoreRef = useRef(value.city || "");

  const [phoneCodeInput, setPhoneCodeInput] = useState(initialPhone.dialCode);
  const phoneNumberInputRef = useRef<HTMLInputElement | null>(null);

  const states = useMemo(
    () => State.getStatesOfCountry(countryIso2 || DEFAULT_COUNTRY).map((item) => ({ code: item.isoCode, name: item.name })),
    [countryIso2],
  );
  const hasStates = states.length > 0;
  const useFreeStateInput = countryIso2 === "AX" || !hasStates;
  const cities = useMemo(
    () => (countryIso2 && stateCode ? City.getCitiesOfState(countryIso2, stateCode) : []),
    [countryIso2, stateCode],
  );
  const cityCandidates = useMemo(() => {
    if (countryIso2 === "AX") return SPECIAL_CITY_OPTIONS.AX.map((name) => ({ name }));
    return cities.map((item) => ({ name: item.name }));
  }, [countryIso2, cities]);

  useEffect(() => {
    const parsed = parsePhoneValue(value.phone);
    setPhoneCodeInput(parsed.dialCode);
    setPhoneNumber(parsed.nationalNumber);
  }, [value.phone]);

  useEffect(() => {
    setCountryIso2(initialCountryIso2);
    const text = value.country && value.country.length > 2 ? value.country : defaultCountryText;
    setCountryText(text);
    setCountryCommitted(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCountryIso2]);

  useEffect(() => {
    const matched = Country.getAllCountries().find((item) => item.name === value.country || item.isoCode === value.country);
    if (matched && matched.isoCode !== countryIso2) setCountryIso2(matched.isoCode);
  }, [countryIso2, value.country]);

  useEffect(() => {
    if (value.state && stateCode && !states.some((item) => item.code === stateCode)) {
      setStateCode("");
      setStateText("");
      setStateCommitted("");
      stateRestoreRef.current = "";
      setCityText("");
      setCityCommitted("");
      cityRestoreRef.current = "";
    }
  }, [stateCode, states, value.state]);

  function commitCountry(nextIso2: string) {
    const nextLabel = `${countryLabel(nextIso2)} (${nextIso2})`;
    setCountryIso2(nextIso2);
    setCountryCommitted(nextLabel);
    countryRestoreRef.current = nextLabel;
    setCountryText(nextLabel);
    setStateCode("");
    setStateText("");
    setStateCommitted("");
    setCityText("");
    setCityCommitted("");
    setCountryOpen(false);
    onChange({ ...value, country: nextLabel, state: "", city: "" });
  }

  function commitState(nextCode: string) {
    const nextName = State.getStateByCodeAndCountry(nextCode, countryIso2 || DEFAULT_COUNTRY)?.name || nextCode;
    const nextLabel = `${nextName} (${nextCode})`;
    setStateCode(nextCode);
    setStateCommitted(nextLabel);
    stateRestoreRef.current = nextLabel;
    setStateText(nextLabel);
    setCityText("");
    setCityCommitted("");
    cityRestoreRef.current = "";
    setStateOpen(false);
    onChange({ ...value, state: nextLabel, city: "" });
  }

  function commitCity(next: string) {
    setCityCommitted(next);
    cityRestoreRef.current = next;
    setCityText(next);
    setCityOpen(false);
    onChange({ ...value, city: next });
  }

  const countryQuery = countryText.trim().toLowerCase();
  const stateQuery = stateText.trim().toLowerCase();
  const cityQuery = cityText.trim().toLowerCase();

  const countryOptions = countryOpen
    ? countries.filter((item) => {
        if (!countryQuery) return true;
        const label = item.label.toLowerCase();
        const iso = item.iso2.toLowerCase();
        return iso.startsWith(countryQuery) || label.startsWith(countryQuery) || label.split(/\s+/).some((word) => word.startsWith(countryQuery));
      })
    : [];
  const stateOptions = stateOpen
    ? states.filter((item) => {
        if (!stateQuery) return true;
        return item.code.toLowerCase().startsWith(stateQuery) || item.name.toLowerCase().startsWith(stateQuery);
      })
    : [];
  const cityOptions = cityOpen
    ? cityCandidates.filter((item) => {
        if (!cityQuery) return true;
        return item.name.toLowerCase().startsWith(cityQuery);
      })
    : [];
  const phoneCodeQuery = phoneCodeInput.trim().replace(/^\+/, "");
  const taxIdRule = getTaxIdRule(countryIso2);
  const phoneCodeOptions = phoneCodeOpen
    ? DIAL_CODE_LABELS.filter((item) => {
        if (!phoneCodeQuery) return true;
        return item.code.replace(/^\+/, "").startsWith(phoneCodeQuery);
      })
    : [];

  const postalValidation = useMemo(
    () => validateCheckoutPostalCode(value),
    [value.country, value.state, value.city, value.postalCode],
  );
  const postalErrorKey = postalValidation.ok ? null : postalValidation.errorKey;
  const postalError = postalErrorKey ? t(`validation.${postalErrorKey}`) : null;

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-5">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field id={`${idPrefix}-firstName`} label={t("firstName")} required value={value.firstName} onChange={(v) => onChange({ ...value, firstName: v })} />
        <Field id={`${idPrefix}-lastName`} label={t("lastName")} required value={value.lastName} onChange={(v) => onChange({ ...value, lastName: v })} />
        <Field id={`${idPrefix}-company`} className="sm:col-span-2" label={t("company")} value={value.company} onChange={(v) => onChange({ ...value, company: v })} />

        <PickerField
          id={`${idPrefix}-country`}
          label={t("country")}
          value={countryText}
          open={countryOpen}
          options={countryOptions}
          placeholder={t("countryPlaceholder")}
          autoComplete="country-name"
          onOpen={() => {
            setCountryText("");
            setCountryOpen(true);
          }}
          onChangeText={(next) => {
            setCountryText(next);
            setCountryOpen(true);
          }}
          onSelect={(item) => commitCountry(item.iso2)}
          onBlur={() => {
            window.setTimeout(() => {
              setCountryOpen(false);
              const typed = normalizeCountryText(countryText);
              if (!typed) {
                setCountryText(countryRestoreRef.current || defaultCountryText);
                return;
              }
              setCountryText(countryRestoreRef.current || defaultCountryText);
            }, 0);
          }}
          renderOption={(item) => `${item.label} (${item.iso2})`}
        />

        <Field id={`${idPrefix}-line1`} className="sm:col-span-2" label={t("street")} required value={value.line1} onChange={(v) => onChange({ ...value, line1: v })} />
        <Field id={`${idPrefix}-line2`} className="sm:col-span-2" label={t("line2")} value={value.line2} onChange={(v) => onChange({ ...value, line2: v })} />

        {hasStates && !useFreeStateInput ? (
          <PickerField
            id={`${idPrefix}-state`}
            label={t("state")}
            value={stateText}
            open={stateOpen}
            options={stateOptions}
            placeholder={t("statePlaceholder")}
            autoComplete="address-level1"
            onOpen={() => {
              setStateText("");
              setStateOpen(true);
            }}
            onChangeText={(next) => {
              setStateText(next);
              setStateOpen(true);
            }}
            onSelect={(item) => commitState(item.code)}
            onBlur={() => {
              window.setTimeout(() => {
                setStateOpen(false);
                setStateText(stateRestoreRef.current || "");
              }, 0);
            }}
            renderOption={(item) => `${item.name} (${item.code})`}
          />
        ) : (
          <Field
            id={`${idPrefix}-state`}
            label={t("state")}
            value={stateText}
            onChange={(next) => {
              setStateText(next);
              setStateCommitted(next);
              stateRestoreRef.current = next;
              onChange({ ...value, state: next });
            }}
          />
        )}

        <PickerField
          id={`${idPrefix}-city`}
          label={t("city")}
          value={cityText}
          open={cityOpen}
          options={cityOptions}
          placeholder={countryIso2 === "AX" ? t("cityPlaceholderMuni") : t("cityPlaceholder")}
          autoComplete="address-level2"
          onOpen={() => {
            setCityText("");
            setCityOpen(true);
          }}
          onChangeText={(next) => {
            setCityText(next);
            setCityOpen(true);
          }}
          onSelect={(item) => commitCity(item.name)}
          onBlur={() => {
            window.setTimeout(() => {
              setCityOpen(false);
              setCityText(cityRestoreRef.current || "");
            }, 0);
          }}
          renderOption={(item) => item.name}
        />

        <div className="relative sm:col-span-2">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              {t("phone")} <span className="text-rose-600">*</span>
            </span>
            <div className="mt-1.5 grid grid-cols-[120px_1fr] gap-3">
              <div className="relative z-30">
                <input
                  type="text"
                  value={phoneCodeInput}
                  onFocus={() => {
                    setPhoneCodeInput("");
                    setPhoneCodeOpen(true);
                  }}
                  onClick={() => {
                    setPhoneCodeInput("");
                    setPhoneCodeOpen(true);
                  }}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPhoneCodeInput(next);
                    setPhoneCodeOpen(true);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setPhoneCodeOpen(false);
                      setPhoneCodeInput(phoneCodeCommitted || "+1");
                    }, 0);
                  }}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                  placeholder="+1"
                  inputMode="tel"
                  autoComplete="tel-country-code"
                />
                {phoneCodeOpen && phoneCodeOptions.length > 0 ? (
                  <div className="absolute left-0 right-0 top-full z-70 mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
                    <div className="max-h-60 overflow-auto py-2">
                      {phoneCodeOptions.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-ink hover:bg-[#f5f5f5]"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setPhoneCodeInput(item.code);
                            setPhoneCodeCommitted(item.code);
                            setPhoneCodeOpen(false);
                            onChange({ ...value, phone: formatPhoneValue(item.code, phoneNumber) });
                          }}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <input
                ref={phoneNumberInputRef}
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D+/g, "");
                  setPhoneNumber(next);
                  onChange({ ...value, phone: formatPhoneValue(phoneCodeInput || phoneCodeCommitted || "+1", next) });
                }}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                placeholder={t("phonePlaceholder")}
                autoComplete="tel-national"
              />
            </div>
          </label>
        </div>

        <Field
          id={`${idPrefix}-postalCode`}
          label={t("postalCode")}
          required
          value={value.postalCode}
          onChange={(v) => onChange({ ...value, postalCode: v })}
          error={postalError}
        />
        <Field
          id={`${idPrefix}-taxId`}
          label={tTax(`${taxIdRule.ruleKey}.label` as "fallback.label" | "BR.label" | "KR.label" | "MX.label" | "NO.label" | "AR.label" | "CL.label")}
          required={taxIdRule.required}
          value={value.taxId}
          onChange={(v) => onChange({ ...value, taxId: v })}
          placeholder={tTax(`${taxIdRule.ruleKey}.placeholder` as "fallback.placeholder" | "BR.placeholder" | "KR.placeholder" | "MX.placeholder" | "NO.placeholder" | "AR.placeholder" | "CL.placeholder")}
        />
      </div>
    </div>
  );
}

function PickerField<T extends { [k: string]: string }>({
  id,
  label,
  value,
  open,
  options,
  placeholder,
  autoComplete,
  onOpen,
  onChangeText,
  onSelect,
  onBlur,
  renderOption,
}: {
  id: string;
  label: string;
  value: string;
  open: boolean;
  options: T[];
  placeholder: string;
  autoComplete: string;
  onOpen: () => void;
  onChangeText: (next: string) => void;
  onSelect: (item: T) => void;
  onBlur: () => void;
  renderOption: (item: T) => string;
}) {
  return (
    <div className="sm:col-span-2 relative">
      <label className="block">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
        <input
          id={id}
          value={value}
          onClick={onOpen}
          onFocus={onOpen}
          onChange={(e) => onChangeText(e.target.value)}
          onBlur={onBlur}
          className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      </label>
      {open && options.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-60 mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
          <div className="max-h-60 overflow-auto py-2">
            {options.map((item) => (
              <button
                key={renderOption(item)}
                type="button"
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-ink hover:bg-[#f5f5f5]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(item)}
              >
                <span>{renderOption(item)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  className = "",
  placeholder,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  error?: string | null;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {label} {required ? <span className="text-rose-600">*</span> : null}
        </span>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={`mt-1.5 w-full rounded-xl border bg-paper px-3 py-2.5 text-sm outline-none ring-ink/20 focus:ring-2 ${
            error ? "border-rose-400 focus:ring-rose-200" : "border-line"
          }`}
          placeholder={placeholder}
        />
      </label>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
