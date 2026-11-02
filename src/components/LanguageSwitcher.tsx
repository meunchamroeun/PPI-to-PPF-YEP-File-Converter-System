"use client";

import React from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = "",
  compact = false,
}) => {
  const { language, setLanguage } = useTranslation();

  return (
    <div
      className={`inline-flex items-center gap-0.5 p-1 h-9 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 ${className}`}
      title="ជ្រើសរើសភាសា / Select Language"
    >
      <div className="pl-1.5 pr-1 text-slate-400 shrink-0">
        <Languages className="w-3.5 h-3.5" />
      </div>

      <button
        type="button"
        onClick={() => setLanguage("kh")}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.97] ${
          language === "kh"
            ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/60 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        {compact ? "KH" : "ខ្មែរ"}
      </button>

      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.97] ${
          language === "en"
            ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/60 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        EN
      </button>
    </div>
  );
};
