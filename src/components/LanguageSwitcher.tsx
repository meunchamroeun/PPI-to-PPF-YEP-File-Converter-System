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
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm ${className}`}
      title="ជ្រើសរើសភាសា / Select Language"
    >
      <div className="pl-1.5 pr-0.5 text-slate-400">
        <Languages className="w-3.5 h-3.5" />
      </div>

      <button
        type="button"
        onClick={() => setLanguage("kh")}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
          language === "kh"
            ? "bg-brand-600 text-white shadow-sm"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        {compact ? "KH" : "ខ្មែរ"}
      </button>

      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
          language === "en"
            ? "bg-brand-600 text-white shadow-sm"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
};
