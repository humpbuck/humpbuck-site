import type { ComponentProps } from "react";

type SvgProps = ComponentProps<"svg">;

/** United States — simplified 13 stripes + canton with stylized stars (readable at ~20px width). */
export function FlagUnitedStates({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 30"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="60" height="30" fill="#B22234" />
      <path
        fill="#FFF"
        d="M0 2.307h60v2.307H0zm0 4.615h60v2.307H0zm0 4.615h60v2.307H0zm0 4.615h60v2.307H0zm0 4.615h60v2.307H0zm0 4.615h60v2.307H0z"
      />
      <rect width="24.38" height="16.154" fill="#3C3B6E" />
      <g fill="#FFF">
        <circle r="0.55" cx="2.9" cy="2.3" />
        <circle r="0.55" cx="5.45" cy="2.3" />
        <circle r="0.55" cx="8" cy="2.3" />
        <circle r="0.55" cx="10.55" cy="2.3" />
        <circle r="0.55" cx="13.1" cy="2.3" />
        <circle r="0.55" cx="15.65" cy="2.3" />
        <circle r="0.55" cx="18.2" cy="2.3" />
        <circle r="0.55" cx="20.75" cy="2.3" />
        <circle r="0.55" cx="4.1" cy="4.85" />
        <circle r="0.55" cx="6.65" cy="4.85" />
        <circle r="0.55" cx="9.2" cy="4.85" />
        <circle r="0.55" cx="11.75" cy="4.85" />
        <circle r="0.55" cx="14.3" cy="4.85" />
        <circle r="0.55" cx="16.85" cy="4.85" />
        <circle r="0.55" cx="19.4" cy="4.85" />
        <circle r="0.55" cx="21.95" cy="4.85" />
        <circle r="0.55" cx="2.9" cy="7.45" />
        <circle r="0.55" cx="5.45" cy="7.45" />
        <circle r="0.55" cx="8" cy="7.45" />
        <circle r="0.55" cx="10.55" cy="7.45" />
        <circle r="0.55" cx="13.1" cy="7.45" />
        <circle r="0.55" cx="15.65" cy="7.45" />
        <circle r="0.55" cx="18.2" cy="7.45" />
        <circle r="0.55" cx="20.75" cy="7.45" />
        <circle r="0.55" cx="4.1" cy="10.05" />
        <circle r="0.55" cx="6.65" cy="10.05" />
        <circle r="0.55" cx="9.2" cy="10.05" />
        <circle r="0.55" cx="11.75" cy="10.05" />
        <circle r="0.55" cx="14.3" cy="10.05" />
        <circle r="0.55" cx="16.85" cy="10.05" />
        <circle r="0.55" cx="19.4" cy="10.05" />
        <circle r="0.55" cx="21.95" cy="10.05" />
        <circle r="0.55" cx="2.9" cy="12.65" />
        <circle r="0.55" cx="5.45" cy="12.65" />
        <circle r="0.55" cx="8" cy="12.65" />
        <circle r="0.55" cx="10.55" cy="12.65" />
        <circle r="0.55" cx="13.1" cy="12.65" />
        <circle r="0.55" cx="15.65" cy="12.65" />
        <circle r="0.55" cx="18.2" cy="12.65" />
        <circle r="0.55" cx="20.75" cy="12.65" />
      </g>
    </svg>
  );
}

/** Brazil — simplified green field, yellow rhombus, blue circle. */
export function FlagBrazil({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#009B3A" />
      <polygon points="15,1.5 28.5,10 15,18.5 1.5,10" fill="#FEDF00" />
      <circle cx="15" cy="10" r="4.2" fill="#002776" />
    </svg>
  );
}

/** Italy — vertical tricolor (green / white / red). */
export function FlagItaly({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="10" height="20" fill="#009246" />
      <rect x="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" width="10" height="20" fill="#CE2B37" />
    </svg>
  );
}

/** France — vertical tricolor (blue / white / red). */
export function FlagFrance({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="10" height="20" fill="#002395" />
      <rect x="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" width="10" height="20" fill="#ED2939" />
    </svg>
  );
}

/** Russia — simplified tricolor (white / blue / red). */
export function FlagRussia({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="6.67" fill="#FFFFFF" />
      <rect y="6.67" width="30" height="6.66" fill="#0039A6" />
      <rect y="13.33" width="30" height="6.67" fill="#D52B1E" />
    </svg>
  );
}

/** Netherlands — horizontal tricolor. */
export function FlagNetherlands({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="6.67" fill="#AE1C28" />
      <rect y="6.67" width="30" height="6.66" fill="#FFFFFF" />
      <rect y="13.33" width="30" height="6.67" fill="#21468B" />
    </svg>
  );
}

/** Hungary — horizontal tricolor. */
export function FlagHungary({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="6.67" fill="#CE2939" />
      <rect y="6.67" width="30" height="6.66" fill="#FFFFFF" />
      <rect y="13.33" width="30" height="6.67" fill="#477050" />
    </svg>
  );
}

/** South Korea — simplified Taegeuk (no trigrams). */
export function FlagSouthKorea({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="5.5" fill="#CD2E3A" />
      <path d="M15 4.5a5.5 5.5 0 0 1 0 11 5.5 5.5 0 0 0 0-11z" fill="#0047A0" />
    </svg>
  );
}

/** Germany — horizontal tricolor. */
export function FlagGermany({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="6.67" fill="#000000" />
      <rect y="6.67" width="30" height="6.66" fill="#DD0000" />
      <rect y="13.33" width="30" height="6.67" fill="#FFCE00" />
    </svg>
  );
}

/** Japan — white field with red disc. */
export function FlagJapan({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="5" fill="#BC002D" />
    </svg>
  );
}

/** Israel — blue stripes with white band (Star of David omitted at small size). */
export function FlagIsrael({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="20" fill="#0038B8" />
      <rect y="3" width="30" height="14" fill="#FFFFFF" />
    </svg>
  );
}

/** Spain — national flag bands (1:2:1 red / yellow / red); escutcheon omitted for clarity at small sizes. */
export function FlagSpain({ className, ...props }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect width="30" height="5" fill="#AA151B" />
      <rect y="5" width="30" height="10" fill="#F1BF00" />
      <rect y="15" width="30" height="5" fill="#AA151B" />
    </svg>
  );
}

const LOCALE_FLAGS = {
  en: FlagUnitedStates,
  es: FlagSpain,
  pt: FlagBrazil,
  ru: FlagRussia,
  fr: FlagFrance,
  it: FlagItaly,
  nl: FlagNetherlands,
  hu: FlagHungary,
  ko: FlagSouthKorea,
  de: FlagGermany,
  ja: FlagJapan,
  he: FlagIsrael,
} as const;

export function LocaleFlagIcon({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  const Cmp = LOCALE_FLAGS[locale as keyof typeof LOCALE_FLAGS];
  if (!Cmp) return null;
  return (
    <Cmp
      className={
        className ??
        "h-[0.9rem] w-[1.26rem] shrink-0 rounded-[1px] border border-line/50 shadow-[0_0_0_0.5px_rgba(0,0,0,0.04)]"
      }
    />
  );
}
