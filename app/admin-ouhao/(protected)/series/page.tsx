import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";

export const dynamic = "force-dynamic";

/** Series admin removed — categories are fixed on the storefront. */
export default async function AdminSeriesRedirectPage() {
  await assertAdmin();
  redirect(adminPath("/inventory"));
}
