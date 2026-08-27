import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";

export const dynamic = "force-dynamic";

/** Legacy admin path — categories are fixed; assign on Products. */
export default async function AdminCategoriesRedirectPage() {
  await assertAdmin();
  redirect(adminPath("/inventory"));
}
