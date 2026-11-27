import type { Metadata } from "next";
import "../globals.css";
import { fontBody, fontDisplay } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Admin · HUMPBUCK",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontBody.variable} ${fontDisplay.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <div className="min-h-screen bg-paper text-ink">{children}</div>
      </body>
    </html>
  );
}
