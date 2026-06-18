import { redirect } from "next/navigation";
import { adminPath } from "@/lib/admin-path";

export default function AdminVideoTutorialRedirectPage() {
  redirect(adminPath("/blog"));
}
