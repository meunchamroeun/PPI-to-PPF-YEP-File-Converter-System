"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations, getTranslation } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "kh",
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default language is STRICTLY "kh" (Khmer)
  const [language, setLanguageState] = useState<Language>("kh");
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("app_lang");
      if (stored === "kh" || stored === "en") {
        setLanguageState(stored);
      } else {
        // Default to "kh"
        setLanguageState("kh");
        localStorage.setItem("app_lang", "kh");
      }
    } catch (_) {}
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("app_lang", lang);
    } catch (_) {}
  };

  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  return useContext(LanguageContext);
};
