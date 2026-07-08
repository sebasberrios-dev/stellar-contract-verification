import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Display face for headlines — tight tracking at large sizes (stellar.org look)
const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "CSV — Contract Source Verify",
  description:
    "Verify Soroban smart contracts: CSV rebuilds contracts from their public source and proves the on-chain WASM matches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased bg-background ${GeistSans.variable} ${GeistMono.variable} ${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        style={{ fontFamily: "var(--font-inter, ui-sans-serif, system-ui, sans-serif)" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
