import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const fontBody = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "HUMPBUCK — DIGI-TEMP Ana-Digi Watches & RM-TONNEAU",
    template: "%s · HUMPBUCK",
  },
  description:
    "HUMPBUCK DIGI-TEMP flagship ana-digi watches — dual LCD, TIME/DATE/ALM/OUT/STW modes, stainless steel. RM-TONNEAU barrel-case line & wholesale programs.",
  openGraph: {
    title: "HUMPBUCK — DIGI-TEMP & RM-TONNEAU",
    description:
      "Official DIGI-TEMP ana-digi collection plus RM-TONNEAU quartz. Factory programs available.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fontBody.variable} ${fontDisplay.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
