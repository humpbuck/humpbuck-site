import { requireAccountSession } from "@/lib/account-server";
import { AccountSidebar } from "@/components/account/account-sidebar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAccountSession();

  return (
    <div className="mx-auto min-w-0 max-w-7xl px-4 py-10 sm:px-6 lg:flex lg:gap-10 lg:py-14">
      <AccountSidebar />
      <div className="mt-8 min-w-0 flex-1 lg:mt-0">{children}</div>
    </div>
  );
}
