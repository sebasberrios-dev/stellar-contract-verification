"use client";

import { useState } from "react";

/**
 * TEMPORARY design-review tool — floating switcher to preview background
 * palettes live on every page. Sets the token CSS variables on <html>, so
 * the whole app (cards, borders, code panels, aurora fade) follows.
 * Remove before merging: delete this file and its <ThemePreview /> in layout.
 */
const VARIANTS = [
  {
    name: "Negro",
    swatch: "hsl(240 14% 3%)",
    vars: {
      "--background": "240 14% 3%",
      "--card": "240 10% 6%",
      "--card-hover": "240 9% 9%",
      "--border": "240 9% 13%",
      "--code": "217 53% 7%",
    },
  },
  {
    name: "Azul espacial",
    swatch: "hsl(222 45% 6%)",
    vars: {
      "--background": "222 45% 5%",
      "--card": "222 38% 8%",
      "--card-hover": "222 34% 11%",
      "--border": "222 28% 16%",
      "--code": "220 50% 8%",
    },
  },
  {
    name: "Púrpura profundo",
    swatch: "hsl(260 25% 5%)",
    vars: {
      "--background": "260 25% 4%",
      "--card": "260 20% 7%",
      "--card-hover": "260 18% 10%",
      "--border": "260 16% 15%",
      "--code": "250 30% 8%",
    },
  },
  {
    name: "Teal nocturno",
    swatch: "hsl(200 40% 5%)",
    vars: {
      "--background": "200 40% 4%",
      "--card": "200 30% 7%",
      "--card-hover": "200 27% 10%",
      "--border": "200 22% 15%",
      "--code": "205 45% 7%",
    },
  },
] as const;

export default function ThemePreview() {
  const [active, setActive] = useState(0);

  function apply(index: number) {
    setActive(index);
    const root = document.documentElement;
    for (const [key, value] of Object.entries(VARIANTS[index].vars)) {
      root.style.setProperty(key, value);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card/90 backdrop-blur-lg border border-border rounded-2xl p-3 shadow-lg">
      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider mb-2">
        Fondo (preview)
      </p>
      <div className="flex flex-col gap-1.5">
        {VARIANTS.map((variant, index) => (
          <button
            key={variant.name}
            type="button"
            onClick={() => apply(index)}
            className={`flex items-center gap-2.5 text-xs rounded-full px-3 py-1.5 border transition-colors ${
              active === index
                ? "border-primary/50 text-foreground bg-card-hover"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className="w-4 h-4 rounded-full border border-white/20 shrink-0"
              style={{ background: variant.swatch }}
            />
            {variant.name}
          </button>
        ))}
      </div>
    </div>
  );
}
