import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VittaOS - Intelligent Financial Operating System",
  description: "Modern autonomous finance, ledger, invoicing, and tax engine for high-growth enterprises.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#FAFAFA] font-sans antialiased text-neutral-900">
        {children}
      </body>
    </html>
  );
}
