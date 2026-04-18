import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAccountSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/account");
  }
  return session;
}
