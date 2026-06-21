/** Header / account menu: initials only — profile photos are not used. */
export function HeaderUserAvatar({
  label,
  size = 28,
}: {
  label: string;
  size?: number;
}) {
  const initial = label.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold tabular-nums text-ink/60 ring-1 ring-[color:var(--color-line)]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
