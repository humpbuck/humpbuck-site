import { DM_Sans, Fraunces } from "next/font/google";

export const fontBody = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "optional",
});

export const fontDisplay = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "optional",
});
