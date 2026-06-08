"use client";

import Link from "next/link";
import Logo from "./Logo";
import NetworkBadge from "./NetworkBadge";
import WalletButton from "./WalletButton";

export default function Navbar() {
  return (
    <header className="relative z-20 border-b border-white/10 px-6 py-4 backdrop-blur-sm bg-[#0a0b0f]/80">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Logo variant="nav" />
          <Link
            href="/for-devs"
            className="text-slate-400 text-sm font-medium hover:text-white transition-colors"
            suppressHydrationWarning
          >
            For Devs
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <NetworkBadge />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
