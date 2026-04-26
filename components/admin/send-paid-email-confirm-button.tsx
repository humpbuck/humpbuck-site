"use client";

type Props = {
  formId: string;
  submitButtonId: string;
};

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function SendPaidEmailConfirmButton({ formId, submitButtonId }: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (!form) return;
        const checked = Array.from(
          form.querySelectorAll<HTMLInputElement>('input[name="ledgerIds"]:checked'),
        );
        if (checked.length === 0) {
          window.alert("Please select at least one paid order.");
          return;
        }
        const totalCents = checked.reduce((sum, el) => {
          const n = Number(el.dataset.commissionCents ?? "0");
          return Number.isFinite(n) ? sum + n : sum;
        }, 0);
        const ok = window.confirm(
          `Send paid notification email now?\n\nSelected orders: ${checked.length}\nTotal commission: ${usd(totalCents)}`,
        );
        if (!ok) return;
        const submitBtn = document.getElementById(submitButtonId) as HTMLButtonElement | null;
        submitBtn?.click();
      }}
      className="inline-flex items-center justify-center rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-sky-900 transition hover:bg-sky-100"
    >
      Send paid email for selected
    </button>
  );
}
