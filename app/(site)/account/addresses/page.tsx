import { auth } from "@/auth";
import { AddressesForm } from "@/components/account/addresses-form";
import { prisma } from "@/lib/prisma";

export default async function AccountAddressesPage() {
  const session = await auth();
  const rows = await prisma.userAddress.findMany({
    where: { userId: session!.user!.id },
  });
  const billing = rows.find((r) => r.type === "billing") ?? null;
  const shipping = rows.find((r) => r.type === "shipping") ?? null;

  return <AddressesForm initialBilling={billing} initialShipping={shipping} />;
}
