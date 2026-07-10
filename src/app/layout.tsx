import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from "../i18n/LanguageContext";
import "./globals.css";

// Inter is the only webfont — body text and headlines. Code and mono UI use
// the system mono stack (--font-mono), so no mono webfont is shipped.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CSV Verify — Contract Source Verify",
  description:
    "Verify Soroban smart contracts: CSV Verify rebuilds contracts from their public source and proves the on-chain WASM matches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased bg-background ${inter.variable}`}
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        style={{ fontFamily: "var(--font-inter, ui-sans-serif, system-ui, sans-serif)" }}
        suppressHydrationWarning
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
