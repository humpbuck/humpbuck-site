"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-line bg-paper py-3 pl-4 pr-11 text-sm outline-none ring-ink/20 focus:ring-2";

export function PasswordInputWithToggle({
  id,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-2">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        className={inputClass}
      />
      <button
        type="button"
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-ink/6 hover:text-ink"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" strokeWidth={2} aria-hidden />
        ) : (
          <Eye className="h-4 w-4" strokeWidth={2} aria-hidden />
        )}
      </button>
    </div>
  );
}
