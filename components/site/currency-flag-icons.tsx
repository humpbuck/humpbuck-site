import type { ComponentProps, ComponentType } from "react";
import {
  FlagBrazil,
  FlagJapan,
  FlagSaudiArabia,
  FlagSouthKorea,
  FlagUnitedStates,
} from "@/components/site/locale-flag-icons";
import {
  DISPLAY_CURRENCY_BY_CODE,
  type DisplayCurrencyCode,
} from "@/lib/display-currency";

type SvgProps = ComponentProps<"svg">;

/** European Union — blue field with stylized gold stars. */
export function FlagEuropeanUnion({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#003399" />
      <g fill="#FFCC00">
        <circle r="0.9" cx="15" cy="4.2" />
        <circle r="0.9" cx="18.1" cy="5.1" />
        <circle r="0.9" cx="20.4" cy="7.4" />
        <circle r="0.9" cx="21.3" cy="10.5" />
        <circle r="0.9" cx="20.4" cy="13.6" />
        <circle r="0.9" cx="18.1" cy="15.9" />
        <circle r="0.9" cx="15" cy="16.8" />
        <circle r="0.9" cx="11.9" cy="15.9" />
        <circle r="0.9" cx="9.6" cy="13.6" />
        <circle r="0.9" cx="8.7" cy="10.5" />
        <circle r="0.9" cx="9.6" cy="7.4" />
        <circle r="0.9" cx="11.9" cy="5.1" />
      </g>
    </svg>
  );
}

/** United Kingdom — simplified Union Jack. */
export function FlagUnitedKingdom({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#012169" />
      <path fill="#FFF" d="M0 0 L30 20 M30 0 L0 20" stroke="#FFF" strokeWidth="3.5" />
      <path fill="none" d="M0 0 L30 20 M30 0 L0 20" stroke="#C8102E" strokeWidth="1.8" />
      <rect x="12" width="6" height="20" fill="#FFF" />
      <rect y="7" width="30" height="6" fill="#FFF" />
      <rect x="13" width="4" height="20" fill="#C8102E" />
      <rect y="8" width="30" height="4" fill="#C8102E" />
    </svg>
  );
}

export function FlagAustralia({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#012169" />
      <rect width="12" height="10" fill="#012169" />
      <path fill="#FFF" d="M0 0h12v1.2H0zm0 2.4h12v1.2H0zm0 2.4h12v1.2H0zm0 2.4h12v1.2H0z" />
      <rect width="5" height="5" fill="#012169" />
      <circle r="0.55" cx="1.2" cy="1.1" fill="#FFF" />
      <circle r="0.55" cx="2.4" cy="1.1" fill="#FFF" />
      <circle r="0.55" cx="3.6" cy="1.1" fill="#FFF" />
      <circle r="0.55" cx="1.8" cy="2.2" fill="#FFF" />
      <circle r="0.55" cx="3" cy="2.2" fill="#FFF" />
      <g fill="#FFF">
        <circle r="0.7" cx="22" cy="13" />
        <circle r="0.55" cx="24.5" cy="11" />
        <circle r="0.55" cx="25.5" cy="14.5" />
        <circle r="0.45" cx="21" cy="10" />
        <circle r="0.45" cx="26" cy="12" />
      </g>
    </svg>
  );
}

export function FlagCanada({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="8" height="20" fill="#D80621" />
      <rect x="8" width="14" height="20" fill="#FFF" />
      <rect x="22" width="8" height="20" fill="#D80621" />
      <path fill="#D80621" d="M15 5.5 L16.8 9.5 H20.5 L17.5 11.8 L18.8 15.8 L15 13.5 L11.2 15.8 L12.5 11.8 L9.5 9.5 H13.2 Z" />
    </svg>
  );
}

export function FlagHongKong({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#DE2910" />
      <circle cx="15" cy="10" r="5.5" fill="#FFF" />
      <circle cx="15" cy="10" r="4.2" fill="#DE2910" />
      <circle cx="15" cy="7.8" r="1" fill="#FFF" />
      <circle cx="17.5" cy="11.2" r="1" fill="#FFF" />
      <circle cx="12.5" cy="11.2" r="1" fill="#FFF" />
      <circle cx="15" cy="13.5" r="1" fill="#FFF" />
      <circle cx="17.5" cy="8.8" r="1" fill="#FFF" />
    </svg>
  );
}

export function FlagSingapore({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="10" fill="#ED2939" />
      <rect y="10" width="30" height="10" fill="#FFF" />
      <circle cx="7.5" cy="6" r="3.2" fill="#FFF" />
      <circle cx="8.4" cy="6" r="2.5" fill="#ED2939" />
      <g fill="#FFF">
        <circle r="0.45" cx="12" cy="3.2" />
        <circle r="0.45" cx="13.5" cy="4" />
        <circle r="0.45" cx="14.2" cy="5.8" />
        <circle r="0.45" cx="13.5" cy="7.6" />
        <circle r="0.45" cx="12" cy="8.4" />
      </g>
    </svg>
  );
}

export function FlagSwitzerland({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#D80027" />
      <rect x="11" y="5" width="8" height="10" fill="#FFF" />
      <rect x="8" y="8" width="14" height="4" fill="#FFF" />
    </svg>
  );
}

export function FlagUnitedArabEmirates({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="6.67" fill="#00732F" />
      <rect y="6.67" width="30" height="6.67" fill="#FFF" />
      <rect y="13.33" width="30" height="6.67" fill="#000" />
      <rect width="8" height="20" fill="#FF0000" />
    </svg>
  );
}

export function FlagThailand({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#FFF" />
      <rect width="30" height="3.3" fill="#ED1C24" />
      <rect y="16.7" width="30" height="3.3" fill="#ED1C24" />
      <rect y="3.3" width="30" height="13.4" fill="#241D4F" />
    </svg>
  );
}

export function FlagMalaysia({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#CC0001" />
      <rect y="2.5" width="30" height="2.5" fill="#FFF" />
      <rect y="5" width="30" height="2.5" fill="#CC0001" />
      <rect y="7.5" width="30" height="2.5" fill="#FFF" />
      <rect y="10" width="30" height="2.5" fill="#CC0001" />
      <rect y="12.5" width="30" height="2.5" fill="#FFF" />
      <rect y="15" width="30" height="2.5" fill="#CC0001" />
      <rect width="12" height="10" fill="#010066" />
      <circle cx="5.5" cy="4.5" r="2.2" fill="#FFCC00" />
      <circle cx="6.2" cy="4.5" r="1.7" fill="#010066" />
    </svg>
  );
}

export function FlagIndia({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="6.67" fill="#FF9933" />
      <rect y="6.67" width="30" height="6.67" fill="#FFF" />
      <rect y="13.33" width="30" height="6.67" fill="#138808" />
      <circle cx="15" cy="10" r="2.2" fill="none" stroke="#000080" strokeWidth="0.7" />
      <circle cx="15" cy="10" r="0.6" fill="#000080" />
    </svg>
  );
}

export function FlagMexico({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="10" height="20" fill="#006847" />
      <rect x="10" width="10" height="20" fill="#FFF" />
      <rect x="20" width="10" height="20" fill="#CE1126" />
      <circle cx="15" cy="10" r="2.5" fill="#8C3A1B" />
    </svg>
  );
}

export function FlagNewZealand({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#012169" />
      <path fill="#FFF" d="M0 0 L12 8 M12 0 L0 8" stroke="#FFF" strokeWidth="2" />
      <path fill="none" d="M0 0 L12 8 M12 0 L0 8" stroke="#C8102E" strokeWidth="1" />
      <g fill="#FFF">
        <circle r="0.7" cx="20" cy="12" />
        <circle r="0.55" cx="23" cy="10" />
        <circle r="0.55" cx="24" cy="13.5" />
        <circle r="0.45" cx="18.5" cy="9" />
      </g>
    </svg>
  );
}

export function FlagSweden({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#006AA7" />
      <rect x="7" width="4" height="20" fill="#FECC00" />
      <rect y="8" width="30" height="4" fill="#FECC00" />
    </svg>
  );
}

export function FlagNorway({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#BA0C2F" />
      <rect x="7" width="5" height="20" fill="#FFF" />
      <rect y="7" width="30" height="5" fill="#FFF" />
      <rect x="8.5" width="2.5" height="20" fill="#00205B" />
      <rect y="8.5" width="30" height="2.5" fill="#00205B" />
    </svg>
  );
}

type RegionFlagComponent = ComponentType<{ className?: string }>;

const REGION_FLAGS: Record<string, RegionFlagComponent> = {
  US: FlagUnitedStates,
  EU: FlagEuropeanUnion,
  GB: FlagUnitedKingdom,
  JP: FlagJapan,
  AU: FlagAustralia,
  CA: FlagCanada,
  HK: FlagHongKong,
  SG: FlagSingapore,
  CH: FlagSwitzerland,
  KR: FlagSouthKorea,
  AE: FlagUnitedArabEmirates,
  SA: FlagSaudiArabia,
  TH: FlagThailand,
  MY: FlagMalaysia,
  IN: FlagIndia,
  BR: FlagBrazil,
  MX: FlagMexico,
  NZ: FlagNewZealand,
  SE: FlagSweden,
  NO: FlagNorway,
};

const FLAG_ICON_CLASS =
  "shrink-0 rounded-[1px] border border-line/50 shadow-[0_0_0_0.5px_rgba(0,0,0,0.04)]";

export function CurrencyFlagIcon({
  code,
  className,
}: {
  code: DisplayCurrencyCode;
  className?: string;
}) {
  const region = DISPLAY_CURRENCY_BY_CODE[code].flagRegion;
  const Cmp = REGION_FLAGS[region];
  if (!Cmp) return null;
  const sizeClass =
    region === "KR" || region === "US"
      ? region === "KR"
        ? "h-[1rem] w-[1.4rem]"
        : "h-[0.9rem] w-[1.35rem]"
      : "h-[0.9rem] w-[1.26rem]";
  return (
    <Cmp
      className={
        className ?? `${sizeClass} ${FLAG_ICON_CLASS}`
      }
    />
  );
}
