import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";

function parseAmountOffCents(raw: FormDataEntryValue | null): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function parseQuantity(raw: FormDataEntryValue | null): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const n = Math.floor(Number(text));
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function parseDateAtStartOfDay(raw: FormDataEntryValue | null): Date | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const d = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function goCoupons(error?: string) {
  if (!error) {
    redirect(adminPath("/coupons"));
  }
  redirect(`${adminPath("/coupons")}?error=${encodeURIComponent(error)}`);
}

async function createCouponAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const amountOffCents = parseAmountOffCents(formData.get("amountOffUsd"));
  const quantity = parseQuantity(formData.get("quantity"));
  const startsAt = parseDateAtStartOfDay(formData.get("startsAt"));
  const endsAt = parseDateAtStartOfDay(formData.get("endsAt"));
  const isActive = String(formData.get("isActive") ?? "") === "on";

  if (!code) goCoupons("Coupon code is required.");
  if (amountOffCents === null) goCoupons("Amount must be greater than 0.");
  if (quantity === null) goCoupons("Quantity must be an integer >= 1.");
  if (!startsAt || !endsAt) goCoupons("Start date and end date are required.");
  if (startsAt.getTime() > endsAt.getTime()) {
    goCoupons("Start date cannot be after end date.");
  }

  try {
    await prisma.coupon.create({
      data: { code, amountOffCents, quantity, startsAt, endsAt, isActive },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create coupon.";
    goCoupons(msg.includes("Coupon_code_key") ? "Coupon code already exists." : msg);
  }
  revalidatePath(adminPath("/coupons"));
  redirect(adminPath("/coupons"));
}

async function updateCouponAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const amountOffCents = parseAmountOffCents(formData.get("amountOffUsd"));
  const quantity = parseQuantity(formData.get("quantity"));
  const startsAt = parseDateAtStartOfDay(formData.get("startsAt"));
  const endsAt = parseDateAtStartOfDay(formData.get("endsAt"));
  const isActive = String(formData.get("isActive") ?? "") === "on";

  if (!id) goCoupons("Missing coupon id.");
  if (!code) goCoupons("Coupon code is required.");
  if (amountOffCents === null) goCoupons("Amount must be greater than 0.");
  if (quantity === null) goCoupons("Quantity must be an integer >= 1.");
  if (!startsAt || !endsAt) goCoupons("Start date and end date are required.");
  if (startsAt.getTime() > endsAt.getTime()) {
    goCoupons("Start date cannot be after end date.");
  }

  try {
    await prisma.coupon.update({
      where: { id },
      data: {
        code,
        amountOffCents,
        quantity,
        startsAt,
        endsAt,
        isActive,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update coupon.";
    goCoupons(msg.includes("Coupon_code_key") ? "Coupon code already exists." : msg);
  }
  revalidatePath(adminPath("/coupons"));
  redirect(adminPath("/coupons"));
}

async function deleteCouponAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) goCoupons("Missing coupon id.");
  await prisma.coupon.delete({ where: { id } });
  revalidatePath(adminPath("/coupons"));
  redirect(adminPath("/coupons"));
}

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await assertAdmin();
  const sp = await searchParams;
  const coupons = await prisma.coupon.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="font-serif text-3xl tracking-tight">Coupons</h1>
      <p className="mt-2 text-sm text-muted">
        Create and manage coupon codes, amount, quantity, and valid date range.
      </p>

      {sp.error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {sp.error}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-line bg-white/60 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Add coupon
        </h2>
        <form action={createCouponAction} className="mt-4 grid gap-3 md:grid-cols-6">
          <input
            name="code"
            required
            placeholder="Code (e.g. SPRING10)"
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input
            name="amountOffUsd"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Amount off (USD)"
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input
            name="startsAt"
            type="date"
            required
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input
            name="endsAt"
            type="date"
            required
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input
            name="quantity"
            type="number"
            min="1"
            step="1"
            required
            placeholder="Quantity"
            defaultValue="1"
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <label className="inline-flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink">
            <span>Active</span>
            <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
          </label>
          <button
            type="submit"
            className="md:col-span-6 inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
          >
            Create coupon
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Existing coupons
        </h2>
        <div className="mt-3 space-y-3">
          {coupons.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white/60 px-5 py-4 text-sm text-muted">
              No coupons yet.
            </p>
          ) : (
            coupons.map((c) => (
              <form
                key={c.id}
                action={updateCouponAction}
                className="grid gap-3 rounded-2xl border border-line bg-white/60 p-4 md:grid-cols-6"
              >
                <input type="hidden" name="id" value={c.id} />
                <input
                  name="code"
                  defaultValue={c.code}
                  required
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <input
                  name="amountOffUsd"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={(c.amountOffCents / 100).toFixed(2)}
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <input
                  name="startsAt"
                  type="date"
                  required
                  defaultValue={ymd(c.startsAt)}
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <input
                  name="endsAt"
                  type="date"
                  required
                  defaultValue={ymd(c.endsAt)}
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                  defaultValue={c.quantity}
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <label className="inline-flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink">
                  <span>Active</span>
                  <input name="isActive" type="checkbox" defaultChecked={c.isActive} className="h-4 w-4" />
                </label>
                <p className="md:col-span-6 -mt-1 text-xs text-muted">
                  Used {c.usedCount} / {c.quantity}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
                  >
                    Save
                  </button>
                  <button
                    formAction={deleteCouponAction}
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-800 transition hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </form>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
