import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { PRODUCT } from "@/config/product";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: PRODUCT.name,
  description: `${PRODUCT.name}: websites for local businesses.`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
