"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  defaultPayoutWhatsapp: string;
  cancelHref: string;
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
  defaultPayoutWhatsapp,
  cancelHref,
}: Props) {
  const defaultWhatsapp = splitPhoneForInput(defaultPayoutWhatsapp);
  const [payoutMethod, setPayoutMethod] = useState(defaultPayoutMethod);
  const [directAccount, setDirectAccount] = useState(defaultPayoutAccount);
  const [realName, setRealName] = useState(parseLabeledValue(defaultPayoutAccount, "Real name"));
  const [recipientName, setRecipientName] = useState(
    parseLabeledValue(defaultPayoutAccount, "Recipient name"),
  );
  const [accountNumber, setAccountNumber] = useState(
    parseLabeledValue(defaultPayoutAccount, "Account number"),
  );
  const [bankName, setBankName] = useState(
    parseLabeledValue(defaultPayoutAccount, "Bank name"),
  );
  const [swiftCode, setSwiftCode] = useState(
    parseLabeledValue(defaultPayoutAccount, "SWIFT/BIC"),
  );
  const [branch, setBranch] = useState(parseLabeledValue(defaultPayoutAccount, "Branch"));
  const [bankAddress, setBankAddress] = useState(
    parseLabeledValue(defaultPayoutAccount, "Bank address"),
  );
  const [bankTransferScope, setBankTransferScope] = useState<"domestic" | "international">(
    parseLabeledValue(defaultPayoutAccount, "Transfer type").toLowerCase() === "international"
      ? "international"
      : "domestic",
  );
  const [payoutWhatsappCountryCode, setPayoutWhatsappCountryCode] = useState("");
  const [payoutWhatsappLocal, setPayoutWhatsappLocal] = useState(defaultWhatsapp.localNumber);

  const payoutAccount = useMemo(() => {
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
  const normalizedPayoutWhatsapp = useMemo(
    () => normalizePhone(payoutWhatsappCountryCode || defaultWhatsapp.countryCode || "+1", payoutWhatsappLocal),
    [defaultWhatsapp.countryCode, payoutWhatsappCountryCode, payoutWhatsappLocal],
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
      ? "Please enter PayPal account (email)"
      : payoutMethod === "alipay"
        ? "Please enter Alipay account"
        : payoutMethod === "bank"
          ? "Please enter bank name, account number, and real name"
          : payoutMethod === "wise" || payoutMethod === "payoneer"
            ? "Please enter registered email"
            : "Describe your preferred payout method";

  return (
    <form action={action} className="mt-3 grid gap-3 md:grid-cols-2">
      <select
        name="payoutMethod"
        value={payoutMethod}
        onChange={(e) => setPayoutMethod(e.target.value)}
        className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
      >
        <option value="">Select payout method</option>
        <option value="paypal">PayPal</option>
        <option value="alipay">Alipay</option>
        <option value="wise">Wise</option>
        <option value="bank">Bank account</option>
        <option value="payoneer">Payoneer</option>
        <option value="other">Other</option>
      </select>
      <p className="text-xs text-muted md:col-span-2">
        Tip: Alipay/PayPal are usually faster. Bank transfer may take 1-3 business days. Receiving-side
        processing fees are borne by the receiver.
      </p>

      {!isBank ? (
        isFreeText ? (
          <textarea
            value={directAccount}
            onChange={(e) => setDirectAccount(e.target.value)}
            placeholder={
              isOther
                ? dynamicPlaceholder
                : payoutMethod === "wise" || payoutMethod === "payoneer"
                  ? "Please enter Wise/Payoneer registered email (double-check spelling)"
                  : `${dynamicPlaceholder} (recipient/account/email/ID)`
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
                ? "Please enter Wise/Payoneer registered email (double-check spelling)"
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
            <option value="domestic">Domestic bank transfer (CN)</option>
            <option value="international">International bank transfer</option>
          </select>
          <input
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="Real name (must match bank card holder)"
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Bank account number / IBAN"
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
        </div>
      )}

      {isBank ? (
        <>
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Bank name"
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder={
              isInternationalBank
                ? "Branch (optional)"
                : "Branch (optional but recommended for domestic transfer)"
            }
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          {isInternationalBank ? (
            <>
              <input
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value)}
                placeholder="SWIFT / BIC code"
                className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
              <input
                value={bankAddress}
                onChange={(e) => setBankAddress(e.target.value)}
                placeholder="Bank address"
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
          placeholder="Real name (required for Alipay verification)"
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
      ) : null}

      {isOther ? (
        <p className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          If your payout method is not listed, please leave your contact details below. We will contact
          you to confirm the payout method.
        </p>
      ) : null}

      {isWise || isPayoneer ? (
        <input
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="Recipient name (for payout verification)"
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
      ) : null}

      <input
        name="payoutEmail"
        defaultValue={defaultPayoutEmail}
        placeholder="Contact email for settlement"
        className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
      />
      <div className="grid grid-cols-[120px_1fr] gap-2">
        <input
          name="payoutWhatsappCountryCode"
          value={payoutWhatsappCountryCode}
          list={PHONE_COUNTRY_CODE_DATALIST_ID}
          inputMode="tel"
          placeholder="+1"
          onChange={(e) => setPayoutWhatsappCountryCode(normalizeCountryCodeInput(e.target.value))}
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
        <input
          name="payoutWhatsappLocal"
          value={payoutWhatsappLocal}
          onChange={(e) => setPayoutWhatsappLocal(e.target.value)}
          inputMode="numeric"
          placeholder="WhatsApp number"
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
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
      <input name="payoutWhatsapp" value={normalizedPayoutWhatsapp} readOnly hidden />

      <div className="flex gap-2 md:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
        >
          Save payout details
        </button>
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
