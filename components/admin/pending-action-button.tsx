"use client";

import { useFormStatus } from "react-dom";

type Props = {
  idleLabel: string;
  pendingLabel: string;
  type?: "submit" | "button";
  className?: string;
  pendingClassName?: string;
  formAction?: ((formData: FormData) => void | Promise<void>) | string;
  name?: string;
  value?: string;
};

export function PendingActionButton({
  idleLabel,
  pendingLabel,
  type = "submit",
  className,
  pendingClassName,
  formAction,
  name,
  value,
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type={type}
      formAction={formAction}
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} ${pending ? (pendingClassName ?? "opacity-70 cursor-not-allowed") : ""}`}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

