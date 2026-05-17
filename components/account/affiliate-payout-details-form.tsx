"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  sanitizeAffiliatePayoutWhatsappContact,
  stripEmbeddedWhatsAppFromPayoutAccount,
} from "@/lib/affiliate-payout-account";
import {
  PHONE_COUNTRY_CODE_DATALIST_ID,
  PHONE_COUNTRY_CODES,
  normalizeCountryCodeInput,
  normalizePhone,
  splitPhoneForInput,
} from "@/lib/phone-normalize";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  defaultPayoutMethod: string;
  defaultPayoutAccount: string;
  defaultPayoutEmail: string;
  defaultWhatsapp: string;
  cancelHref: string;
  showSaveSuccess?: boolean;
};

function parseLabeledValue(payload: string, label: string): string {
  const match = payload.match(new RegExp(`${label}:\\s*(.+)`));
  return match?.[1]?.trim() ?? "";
}

function buildBankPayoutAccount(input: {
  transferScope: "domestic" | "international";
  realName: string;
  accountNumber: string;
  bankName: string;
  swiftCode: string;
  branch: string;
  bankAddress: string;
}): string {
  const isInternational = input.transferScope === "international";
  const rows = [
    `Transfer type: ${isInternational ? "International" : "Domestic"}`,
    `Real name: ${input.realName.trim()}`,
    `Account number: ${input.accountNumber.trim()}`,
    input.bankName.trim() ? `Bank name: ${input.bankName.trim()}` : "",
    input.branch.trim() ? `Branch: ${input.branch.trim()}` : "",
    isInternational && input.swiftCode.trim() ? `SWIFT/BIC: ${input.swiftCode.trim()}` : "",
    isInternational && input.bankAddress.trim() ? `Bank address: ${input.bankAddress.trim()}` : "",
  ].filter(Boolean);
  return rows.join("\n").trim();
}

function buildEmailPayoutAccount(input: { accountEmail: string; recipientName: string }): string {
  const rows = [
    `Recipient email: ${input.accountEmail.trim()}`,
    `Recipient name: ${input.recipientName.trim()}`,
  ].filter((row) => !row.endsWith(":"));
  return rows.join("\n").trim();
}

export function AffiliatePayoutDetailsForm({
  action,
  defaultPayoutMethod,
  defaultPayoutAccount,
  defaultPayoutEmail,
  defaultWhatsapp,
  cancelHref,
  showSaveSuccess = false,
}: Props) {
  const t = useTranslations("AccountAffiliate");
  const defaultWhatsappPhone = splitPhoneForInput(defaultWhatsapp);
  const defaultAccountClean = stripEmbeddedWhatsAppFromPayoutAccount(defaultPayoutAccount);
  const [payoutMethod, setPayoutMethod] = useState(defaultPayoutMethod);
  const [directAccount, setDirectAccount] = useState(defaultAccountClean);
  const [realName, setRealName] = useState(parseLabeledValue(defaultAccountClean, "Real name"));
  const [recipientName, setRecipientName] = useState(
    parseLabeledValue(defaultAccountClean, "Recipient name"),
  );
  const [accountNumber, setAccountNumber] = useState(
    parseLabeledValue(defaultAccountClean, "Account number"),
  );
  const [bankName, setBankName] = useState(
    parseLabeledValue(defaultAccountClean, "Bank name"),
  );
  const [swiftCode, setSwiftCode] = useState(
    parseLabeledValue(defaultAccountClean, "SWIFT/BIC"),
  );
  const [branch, setBranch] = useState(parseLabeledValue(defaultAccountClean, "Branch"));
  const [bankAddress, setBankAddress] = useState(
    parseLabeledValue(defaultAccountClean, "Bank address"),
  );
  const [bankTransferScope, setBankTransferScope] = useState<"domestic" | "international">(
    parseLabeledValue(defaultAccountClean, "Transfer type").toLowerCase() === "international"
      ? "international"
      : "domestic",
  );
  const [whatsappCountryCode, setWhatsappCountryCode] = useState(defaultWhatsappPhone.countryCode);
  const [whatsappLocal, setWhatsappLocal] = useState(defaultWhatsappPhone.localNumber);
  const [whatsappContact, setWhatsappContact] = useState(
    sanitizeAffiliatePayoutWhatsappContact(parseLabeledValue(defaultPayoutAccount, "WhatsApp")) ||
      defaultWhatsapp,
  );

  const payoutAccount = useMemo(() => {
    if (!payoutMethod) {
      return "";
    }
    if (payoutMethod === "wise" || payoutMethod === "payoneer") {
      return buildEmailPayoutAccount({
        accountEmail: directAccount,
        recipientName,
      });
    }
    if (payoutMethod === "alipay") {
      const rows = [
        `Alipay account: ${directAccount.trim()}`,
        `Real name: ${realName.trim()}`,
      ].filter((row) => !row.endsWith(":"));
      return rows.join("\n").trim();
    }
    if (payoutMethod === "bank") {
      return buildBankPayoutAccount({
        transferScope: bankTransferScope,
        realName,
        accountNumber,
        bankName,
        swiftCode,
        branch,
        bankAddress,
      });
    }
    return directAccount.trim();
  }, [
    accountNumber,
    bankAddress,
    bankName,
    bankTransferScope,
    branch,
    directAccount,
    payoutMethod,
    realName,
    recipientName,
    swiftCode,
  ]);
  const normalizedWhatsapp = useMemo(
    () => normalizePhone(whatsappCountryCode || defaultWhatsappPhone.countryCode || "+1", whatsappLocal),
    [defaultWhatsappPhone.countryCode, whatsappCountryCode, whatsappLocal],
  );

  const isBank = payoutMethod === "bank";
  const isAlipay = payoutMethod === "alipay";
  const isOther = payoutMethod === "other";
  const isWise = payoutMethod === "wise";
  const isPayoneer = payoutMethod === "payoneer";
  const isFreeText = isWise || isPayoneer || isOther;
  const isInternationalBank = isBank && bankTransferScope === "international";
  const dynamicPlaceholder =
    payoutMethod === "paypal"
      ? t("payoutForm.placeholderPaypal")
      : payoutMethod === "alipay"
        ? t("payoutForm.placeholderAlipay")
        : payoutMethod === "bank"
          ? t("payoutForm.placeholderBank")
          : payoutMethod === "wise" || payoutMethod === "payoneer"
            ? t("payoutForm.placeholderWisePayoneer")
            : t("payoutForm.placeholderOther");
  const SCROLL_STORAGE_KEY = "affiliate_payout_submit_scroll_y";

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const ok = window.confirm(t("payoutForm.confirm"));
        if (!ok) {
          e.preventDefault();
          return;
        }
        window.sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
      }}
      className="mt-3 grid gap-3 md:grid-cols-2"
    >
      <select
        name="payoutMethod"
        value={payoutMethod}
        onChange={(e) => {
          const next = e.target.value;
          setPayoutMethod(next);
          if (!next) {
            setDirectAccount("");
            setRealName("");
            setRecipientName("");
            setAccountNumber("");
            setBankName("");
            setSwiftCode("");
            setBranch("");
            setBankAddress("");
            setBankTransferScope("domestic");
          }
        }}
        className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
      >
        <option value="">{t("payoutForm.selectMethod")}</option>
        <option value="paypal">{t("payoutPaypal")}</option>
        <option value="alipay">{t("payoutAlipay")}</option>
        <option value="wise">{t("payoutWise")}</option>
        <option value="bank">{t("payoutBank")}</option>
        <option value="payoneer">{t("payoutPayoneer")}</option>
        <option value="other">{t("payoutOther")}</option>
      </select>
      <p className="text-xs text-muted md:col-span-2">{t("payoutForm.tip")}</p>

      {!isBank ? (
        isFreeText ? (
          <textarea
            value={directAccount}
            onChange={(e) => setDirectAccount(e.target.value)}
            placeholder={
              isOther
                ? dynamicPlaceholder
                : payoutMethod === "wise" || payoutMethod === "payoneer"
                  ? t("payoutForm.placeholderWisePayoneerCheck")
                  : t("payoutForm.placeholderFreeTextDetail", { hint: dynamicPlaceholder })
            }
            rows={3}
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
        ) : (
          <input
            value={directAccount}
            onChange={(e) => setDirectAccount(e.target.value)}
            placeholder={
              payoutMethod === "wise" || payoutMethod === "payoneer"
                ? t("payoutForm.placeholderWisePayoneerCheck")
                : dynamicPlaceholder
            }
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
        )
      ) : (
        <div className="grid gap-3 md:col-span-1">
          <select
            value={bankTransferScope}
            onChange={(e) => setBankTransferScope(e.target.value as "domestic" | "international")}
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          >
            <option value="domestic">{t("payoutForm.bankDomestic")}</option>
            <option value="international">{t("payoutForm.bankInternational")}</option>
          </select>
          <input
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder={t("payoutForm.realNameBank")}
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={t("payoutForm.accountNumber")}
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
        </div>
      )}

      {isBank ? (
        <>
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder={t("payoutForm.bankName")}
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder={
              isInternationalBank
                ? t("payoutForm.branchOptionalIntl")
                : t("payoutForm.branchOptionalDomestic")
            }
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          {isInternationalBank ? (
            <>
              <input
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value)}
                placeholder={t("payoutForm.swift")}
                className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
              <input
                value={bankAddress}
                onChange={(e) => setBankAddress(e.target.value)}
                placeholder={t("payoutForm.bankAddress")}
                className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2 md:col-span-2"
              />
            </>
          ) : null}
        </>
      ) : null}

      {isAlipay ? (
        <input
          value={realName}
          onChange={(e) => setRealName(e.target.value)}
          placeholder={t("payoutForm.realNameAlipay")}
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
      ) : null}

      {isOther ? (
        <p className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {t("payoutForm.otherNotice")}
        </p>
      ) : null}

      {isWise || isPayoneer ? (
        <input
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder={t("payoutForm.recipientName")}
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
      ) : null}

      <input
        name="payoutEmail"
        defaultValue={defaultPayoutEmail}
        placeholder={t("payoutForm.contactEmail")}
        className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
      />
      <div className="grid grid-cols-[120px_1fr] gap-2">
        <input
          name="whatsappCountryCode"
          value={whatsappCountryCode}
          list={PHONE_COUNTRY_CODE_DATALIST_ID}
          inputMode="tel"
          placeholder={t("payoutForm.phoneCountryPlaceholder")}
          onChange={(e) => setWhatsappCountryCode(normalizeCountryCodeInput(e.target.value))}
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
        <input
          name="whatsappLocal"
          value={whatsappLocal}
          onChange={(e) => setWhatsappLocal(e.target.value)}
          inputMode="numeric"
          placeholder={t("payoutForm.telephone")}
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
      </div>
      <div className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus-within:ring-2 md:col-span-2">
        <span className="font-medium text-ink/90">{t("payoutForm.whatsappLabel")} </span>
        <input
          name="whatsappContact"
          value={whatsappContact}
          onChange={(e) =>
            setWhatsappContact(sanitizeAffiliatePayoutWhatsappContact(e.target.value))
          }
          placeholder={t("payoutForm.whatsappPlaceholder")}
          className="w-[calc(100%-88px)] border-0 bg-transparent p-0 text-sm text-ink outline-none"
        />
      </div>
      <datalist id={PHONE_COUNTRY_CODE_DATALIST_ID}>
        {PHONE_COUNTRY_CODES.map((code) => (
          <option key={code} value={code} />
        ))}
      </datalist>

      <input name="payoutAccount" value={payoutAccount} readOnly hidden />
      <input name="payoutRealName" value={realName} readOnly hidden />
      <input name="payoutBankTransferScope" value={bankTransferScope} readOnly hidden />
      <input name="whatsapp" value={normalizedWhatsapp} readOnly hidden />

      <div className="flex gap-2 md:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
        >
          {t("payoutForm.save")}
        </button>
        <Link
          href={cancelHref}
          scroll={false}
          className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20"
        >
          {t("payoutForm.cancel")}
        </Link>
        {showSaveSuccess ? (
          <span className="inline-flex items-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-medium text-sky-900">
            {t("payoutForm.savedSuccess")}
          </span>
        ) : null}
      </div>
    </form>
  );
}
