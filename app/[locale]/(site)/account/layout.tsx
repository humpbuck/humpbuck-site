import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { requireAccountSession } from "@/lib/account-server";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { ACCOUNT_CLIENT_NAMESPACES, pickClientMessages } from "@/lib/client-messages";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAccountSession();
  const messages = await getMessages({ locale });
  const clientMessages = pickClientMessages(messages, ACCOUNT_CLIENT_NAMESPACES);

  return (
    <NextIntlClientProvider locale={locale} messages={clientMessages}>
      <div className="mx-auto min-w-0 max-w-7xl px-4 py-10 sm:px-6 lg:flex lg:gap-10 lg:py-14">
        <AccountSidebar />
        <div className="mt-8 min-w-0 flex-1 lg:mt-0">{children}</div>
      </div>
    </NextIntlClientProvider>
  );
}
