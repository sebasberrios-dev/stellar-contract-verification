import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Soroban Verify",
  description: "Cryptographic contract verification for Soroban",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${GeistSans.variable} ${GeistMono.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      style={{ background: "#0a0b0f" }}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ background: "#0a0b0f", color: "#ffffff", fontFamily: "var(--font-inter, ui-sans-serif, system-ui, sans-serif)" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
