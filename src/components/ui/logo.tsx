"use client";

import React from "react";
import Image from "next/image";

interface LogoProps {
  variant?: "full" | "mark" | "compact";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showBadge?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
  showBadge = true,
}) => {
  // Dimensions map
  const markDimensions = {
    xs: { w: 24, h: 24, text: "text-xs", sub: "text-[9px]" },
    sm: { w: 32, h: 32, text: "text-sm", sub: "text-[10px]" },
    md: { w: 40, h: 40, text: "text-base", sub: "text-xs" },
    lg: { w: 56, h: 56, text: "text-xl", sub: "text-sm" },
    xl: { w: 72, h: 72, text: "text-2xl", sub: "text-base" },
  }[size];

  // Pure logomark
  if (variant === "mark") {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src="/logomark.svg"
          alt="Yamaha ExpVoice Studio Logo"
          width={markDimensions.w}
          height={markDimensions.h}
          className="rounded-xl shadow-md shadow-brand-500/20 active:scale-[0.97] transition-transform duration-150"
          priority
        />
      </div>
    );
  }

  // Compact variant (Emblem + inline text)
  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
        <div className="relative shrink-0">
          <Image
            src="/logomark.svg"
            alt="Yamaha ExpVoice Studio Logomark"
            width={markDimensions.w}
            height={markDimensions.h}
            className="rounded-xl shadow-md shadow-brand-500/20"
            priority
          />
        </div>
        <div className="flex flex-col leading-tight">
          <span className={`font-black tracking-tight text-slate-900 dark:text-white ${markDimensions.text}`}>
            ExpVoice <span className="text-brand-600 dark:text-brand-400">Studio</span>
          </span>
          <span className={`font-medium text-slate-500 dark:text-slate-400 ${markDimensions.sub}`}>
            PPI Converter v2.5
          </span>
        </div>
      </div>
    );
  }

  // Full Horizontal Lockup
  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      <div className="relative shrink-0">
        <Image
          src="/logomark.svg"
          alt="Yamaha ExpVoice Studio Logomark"
          width={markDimensions.w}
          height={markDimensions.h}
          className="rounded-2xl shadow-lg shadow-brand-500/25"
          priority
        />
      </div>
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-brand-600 dark:text-sky-400">
            YAMAHA EXPANSION ENGINE
          </span>
          {showBadge && (
            <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-indigo-300 border border-brand-200 dark:border-slate-700">
              v2.5
            </span>
          )}
        </div>
        <span className={`font-black tracking-tight text-slate-900 dark:text-white ${markDimensions.text}`}>
          ExpVoice <span className="bg-gradient-to-r from-brand-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Studio</span>
        </span>
        <span className={`font-medium tracking-wide text-slate-500 dark:text-slate-400 ${markDimensions.sub}`}>
          PPI • PPF • YEP File Converter System
        </span>
      </div>
    </div>
  );
};
