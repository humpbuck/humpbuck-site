"use client";

import { useTranslations } from "next-intl";

function StripeLogo({ subtitle }: { subtitle: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-3 whitespace-nowrap">
      <span className="text-[32px] font-black leading-none tracking-[-0.12em] text-white">S</span>
      <span className="inline-flex items-baseline gap-1.5 text-white">
        <span className="text-[18px] font-semibold tracking-[-0.04em]">Stripe</span>
        <span className="text-[14px] font-normal tracking-[-0.01em] text-white/86">- {subtitle}</span>
      </span>
    </span>
  );
}

function PayPalLogo() {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="relative inline-flex h-8 w-9 items-center justify-center">
        <span className="absolute left-1 top-0 text-[31px] font-black italic leading-none tracking-[-0.16em] text-[#003087]">P</span>
        <span className="absolute left-3 top-0 text-[31px] font-black italic leading-none tracking-[-0.16em] text-[#009CDE]">P</span>
      </span>
      <span className="text-[20px] font-semibold tracking-[-0.06em] text-[#003087]">PayPal</span>
    </span>
  );
}

function ButtonShell({
  children,
  tone,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  tone: "stripe" | "paypal";
  disabled: boolean;
  onClick: () => void;
}) {
  const base =
    "group relative flex h-[74px] w-full items-center justify-center overflow-hidden rounded-[20px] border px-5 text-center transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55";
  const toneClasses =
    tone === "stripe"
      ? "border-[#5f58ef] bg-[#635BFF] text-white shadow-[0_1px_0_rgba(255,255,255,0.18),0_10px_24px_rgba(99,91,255,0.18)] hover:bg-[#5750f3] hover:shadow-[0_1px_0_rgba(255,255,255,0.22),0_14px_30px_rgba(99,91,255,0.24)] focus-visible:ring-[#635BFF]/30"
      : "border-[#edc95d] bg-[#FFC439] text-[#003087] shadow-[0_1px_0_rgba(255,255,255,0.22),0_10px_24px_rgba(0,48,135,0.08)] hover:bg-[#ffcf55] hover:shadow-[0_1px_0_rgba(255,255,255,0.26),0_14px_30px_rgba(0,48,135,0.12)] focus-visible:ring-[#FFC439]/30";

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`${base} ${toneClasses}`}>
      <span className="absolute inset-0 bg-white/0 transition group-hover:bg-black/5" />
      <span className="relative flex w-full items-center justify-center gap-3">
        {children}
      </span>
    </button>
  );
}

export function PaymentBrandButtons({
  disabled,
  loading,
  onStripe,
  onPayPal,
}: {
  disabled: boolean;
  loading: "stripe" | "paypal" | null;
  onStripe: () => void;
  onPayPal: () => void;
}) {
  const t = useTranslations("Payment");
  const stripeDisabled = disabled || loading !== null;
  const paypalDisabled = disabled || loading !== null;

  return (
    <div className="space-y-3.5">
      <ButtonShell tone="stripe" disabled={stripeDisabled} onClick={onStripe}>
        <StripeLogo subtitle={t("stripeSubtitle")} />
      </ButtonShell>

      <ButtonShell tone="paypal" disabled={paypalDisabled} onClick={onPayPal}>
        <PayPalLogo />
      </ButtonShell>
    </div>
  );
}
