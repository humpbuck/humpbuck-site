import { auth } from "@/auth";
import { AccountAvatarPicker } from "@/components/account/account-avatar-picker";
import { AccountDetailsForm } from "@/components/account/account-details-form";
import { prisma } from "@/lib/prisma";

export default async function AccountDetailsPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    select: {
      firstName: true,
      lastName: true,
      displayName: true,
      email: true,
      image: true,
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Account details
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Profile & security</h1>
      <p className="mt-2 text-sm text-muted">
        Update how we address you and manage your password.
      </p>
      <div className="mt-10 space-y-10">
        <AccountAvatarPicker initialImage={user.image} />
        <AccountDetailsForm initial={user} />
      </div>
    </div>
  );
}
