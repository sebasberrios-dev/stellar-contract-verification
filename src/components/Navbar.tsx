"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Globe, Menu, X } from "lucide-react";
import NetworkBadge from "./NetworkBadge";
import WalletButton from "./WalletButton";
import { useI18n } from "../i18n/LanguageContext";

function BrandLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded-lg"
      aria-label="CSV Verify — Contract Source Verify, home"
      suppressHydrationWarning
    >
      {/* Neon logo with real alpha — sits clean on any background */}
      <Image
        src="/images/csv-logo.webp"
        alt=""
        width={1189}
        height={513}
        priority
        className="h-9 w-auto select-none brand-media"
        aria-hidden="true"
      />
      <span className="hidden sm:inline text-foreground text-[13px] font-medium tracking-wide whitespace-nowrap">
        Contract Source Verify
      </span>
    </Link>
  );
}

function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      aria-label={lang === "en" ? "Cambiar a español" : "Switch to English"}
      className="inline-flex items-center gap-1.5 h-9 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <Globe className="w-3.5 h-3.5" aria-hidden="true" />
      {lang.toUpperCase()}
    </button>
  );
}

export default function Navbar() {
  const { d } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [menuOpen]);

  const chrome =
    scrolled || menuOpen
      ? "bg-background/80 backdrop-blur-lg border-b border-border"
      : "bg-transparent border-b border-transparent";

  return (
    <header
      ref={menuRef}
      className={`fixed top-0 inset-x-0 z-20 transition-colors duration-300 ${chrome}`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 px-6 h-16">
        <div className="flex items-center gap-8">
          <BrandLogo />
          <Link
            href="/for-devs"
            className="hidden md:inline text-muted-foreground text-sm font-medium hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded"
            suppressHydrationWarning
          >
            {d.nav.forDevs}
          </Link>
          <Link
            href="/api-docs"
            className="hidden md:inline text-muted-foreground text-sm font-medium hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded"
            suppressHydrationWarning
          >
            {d.nav.apiDocs}
          </Link>
        </div>

        {/* Desktop controls */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageToggle />
          <NetworkBadge />
          <WalletButton />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          {menuOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile panel */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg px-6 py-4 flex flex-col gap-4"
        >
          <Link
            href="/for-devs"
            onClick={() => setMenuOpen(false)}
            className="text-foreground/90 text-sm font-medium py-2 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded"
            suppressHydrationWarning
          >
            {d.nav.forDevs}
          </Link>
          <Link
            href="/api-docs"
            onClick={() => setMenuOpen(false)}
            className="text-foreground/90 text-sm font-medium py-2 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded"
            suppressHydrationWarning
          >
            {d.nav.apiDocs}
          </Link>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
            <LanguageToggle />
            <NetworkBadge className="flex" />
            <WalletButton />
          </div>
        </nav>
      )}
    </header>
  );
}
