import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-600 text-white shadow-xs hover:bg-brand-500",
        secondary: "border-slate-200/60 dark:border-white/10 bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100",
        destructive: "border-rose-500/20 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
        outline: "text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-[#1c1c1f]/60 backdrop-blur-md",
        success: "border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
        warning: "border-amber-500/20 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
