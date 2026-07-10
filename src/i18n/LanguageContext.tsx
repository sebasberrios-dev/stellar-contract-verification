"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Dict, type Lang } from "./translations";

const STORAGE_KEY = "csv-lang";

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Active dictionary — d.section.key */
  d: Dict;
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * English is the default (and the SSR) language; the saved preference is
 * applied after mount so server and client markup always match.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // The saved preference can only be applied after mount — reading
      // localStorage during render would make client markup diverge from the
      // English SSR output and break hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "es" || saved === "en") setLangState(saved);
    } catch {
      // Storage unavailable (private mode) — stay on the default
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference simply won't persist
    }
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, d: translations[lang] }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <LanguageProvider>");
  return ctx;
}
