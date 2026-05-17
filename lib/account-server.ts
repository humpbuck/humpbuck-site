import { auth } from "@/auth";
import { redirectWithLocale } from "@/lib/storefront-redirect";

export async function requireAccountSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return redirectWithLocale("/auth/login?callbackUrl=/account");
  }
  return session;
}
