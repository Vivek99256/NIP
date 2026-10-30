import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorScheme?: "sky" | "teal" | "emerald" | "amber" | "indigo" | "rose";
  className?: string;
}

const colorMap = {
  sky: "bg-sky-50 text-sky-600 border-sky-100",
  teal: "bg-teal-50 text-teal-600 border-teal-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  colorScheme = "sky",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={cn("rounded-xl border p-3", colorMap[colorScheme])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {(description || trend) && (
        <div className="mt-3 flex items-center text-xs text-slate-500">
          {trend && (
            <span
              className={cn(
                "mr-1.5 font-semibold",
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {trend.value}
            </span>
          )}
          {description && <span>{description}</span>}
        </div>
      )}
    </div>
  );
}
