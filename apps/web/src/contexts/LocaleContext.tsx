import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Locale, TranslationKey } from "../lib/i18n";
import { translate, DEFAULT_LOCALE } from "../lib/i18n";

const STORAGE_KEY = "skilldock.locale";

function getInitialLocale(): Locale {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en-US" || stored === "zh-CN") return stored;
    if (navigator.language.startsWith("zh")) return "zh-CN";
  }
  return DEFAULT_LOCALE;
}

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
} | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLocale);
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en-US" ? "zh-CN" : "en-US");
  }, [locale, setLocale]);

  const t = useCallback((key: TranslationKey, params?: Record<string, string>) => {
    return translate(locale, key, params);
  }, [locale]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
