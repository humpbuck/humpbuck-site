import { auth } from "@/auth";
import { PaymentMethodsClient } from "@/components/account/payment-methods-client";
import { prisma } from "@/lib/prisma";

export default async function PaymentMethodsPage() {
  const session = await auth();
  const items = await prisma.savedPaymentMethod.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
  });

  return <PaymentMethodsClient initialItems={items} />;
}
