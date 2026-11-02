"use client";

import React from "react";
import { Switch } from "@base-ui/react";
import { cn } from "@/lib/utils";

interface BaseSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}

export const BaseSwitch: React.FC<BaseSwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  className = "",
}) => {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      {(label || description) && (
        <div>
          {label && <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</p>}
          {description && <p className="text-[11px] text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      )}
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500",
          checked ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-700"
        )}
      >
        <Switch.Thumb
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </Switch.Root>
    </div>
  );
};
