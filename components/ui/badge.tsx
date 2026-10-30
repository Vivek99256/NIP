import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-sky-100 text-sky-800 hover:bg-sky-200/80",
        secondary: "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200/80",
        destructive: "border-transparent bg-rose-100 text-rose-800",
        success: "border-transparent bg-emerald-100 text-emerald-800",
        warning: "border-transparent bg-amber-100 text-amber-800",
        outline: "text-slate-700 border-slate-300",
        info: "border-transparent bg-blue-100 text-blue-800",
        purple: "border-transparent bg-purple-100 text-purple-800",
        teal: "border-transparent bg-teal-100 text-teal-800",
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
