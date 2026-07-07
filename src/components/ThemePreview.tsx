"use client";

import { useState } from "react";

/**
 * TEMPORARY design-review tool — floating switcher to preview FULL color
 * palettes live on every page: backgrounds, cards, borders, accents,
 * buttons, aurora, code panels, and the brand media (logo + hero video are
 * hue-rotated from their cyan source via --media-hue / .brand-media).
 * Remove before merging: delete this file and its <ThemePreview /> in layout.
 */
const PALETTES = [
  {
    name: "Cian eléctrico",
    swatch: ["hsl(195 100% 50%)", "hsl(240 14% 3%)"],
    vars: {
      "--background": "240 14% 3%",
      "--card": "240 10% 6%",
      "--card-hover": "240 9% 9%",
      "--border": "240 9% 13%",
      "--code": "217 53% 7%",
      "--primary": "195 100% 50%",
      "--primary-foreground": "228 20% 5%",
      "--secondary": "217 91% 60%",
      "--accent": "271 91% 65%",
      "--ring": "195 100% 50%",
      "--media-hue": "0deg",
    },
  },
  {
    name: "Oro Stellar",
    swatch: ["hsl(48 96% 53%)", "hsl(0 0% 2%)"],
    vars: {
      "--background": "0 0% 2%",
      "--card": "0 0% 6%",
      "--card-hover": "0 0% 9%",
      "--border": "0 0% 14%",
      "--code": "40 20% 6%",
      "--primary": "48 96% 53%",
      "--primary-foreground": "0 0% 5%",
      "--secondary": "36 90% 50%",
      "--accent": "15 85% 55%",
      "--ring": "48 96% 53%",
      "--media-hue": "-147deg",
    },
  },
  {
    name: "Ember cálido",
    swatch: ["hsl(22 92% 58%)", "hsl(20 14% 3%)"],
    vars: {
      "--background": "20 14% 3%",
      "--card": "20 10% 6%",
      "--card-hover": "20 9% 9%",
      "--border": "20 10% 13%",
      "--code": "20 25% 7%",
      "--primary": "22 92% 58%",
      "--primary-foreground": "20 14% 4%",
      "--secondary": "350 80% 58%",
      "--accent": "42 90% 58%",
      "--ring": "22 92% 58%",
      "--media-hue": "-173deg",
    },
  },
  {
    name: "Esmeralda",
    swatch: ["hsl(160 84% 45%)", "hsl(170 25% 3%)"],
    vars: {
      "--background": "170 25% 3%",
      "--card": "170 18% 6%",
      "--card-hover": "170 16% 9%",
      "--border": "170 14% 13%",
      "--code": "175 30% 6%",
      "--primary": "160 84% 45%",
      "--primary-foreground": "170 25% 4%",
      "--secondary": "142 70% 48%",
      "--accent": "88 75% 52%",
      "--ring": "160 84% 45%",
      "--media-hue": "-35deg",
    },
  },
  {
    name: "Violeta neón",
    swatch: ["hsl(270 90% 65%)", "hsl(260 20% 3%)"],
    vars: {
      "--background": "260 20% 3%",
      "--card": "260 15% 6%",
      "--card-hover": "260 13% 9%",
      "--border": "260 12% 14%",
      "--code": "255 25% 7%",
      "--primary": "270 90% 65%",
      "--primary-foreground": "260 20% 4%",
      "--secondary": "300 85% 60%",
      "--accent": "220 90% 65%",
      "--ring": "270 90% 65%",
      "--media-hue": "75deg",
    },
  },
] as const;

export default function ThemePreview() {
  const [active, setActive] = useState(0);

  function apply(index: number) {
    setActive(index);
    const root = document.documentElement;
    for (const [key, value] of Object.entries(PALETTES[index].vars)) {
      root.style.setProperty(key, value);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card/90 backdrop-blur-lg border border-border rounded-2xl p-3 shadow-lg">
      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider mb-2">
        Paleta (preview)
      </p>
      <div className="flex flex-col gap-1.5">
        {PALETTES.map((palette, index) => (
          <button
            key={palette.name}
            type="button"
            onClick={() => apply(index)}
            className={`flex items-center gap-2.5 text-xs rounded-full px-3 py-1.5 border transition-colors ${
              active === index
                ? "border-primary/50 text-foreground bg-card-hover"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex shrink-0 -space-x-1">
              {palette.swatch.map((color) => (
                <span
                  key={color}
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ background: color }}
                />
              ))}
            </span>
            {palette.name}
          </button>
        ))}
      </div>
    </div>
  );
}
