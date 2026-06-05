import { redirect } from "@/i18n/navigation";

export default async function WholesaleListingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/wholesale", locale });
}
