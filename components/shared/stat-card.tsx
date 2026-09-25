import React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps {
  title: string;
  amount?: number;
  formattedValue?: string;
  currency?: boolean;
  change?: {
    value: number; // percentage or absolute value
    label?: string;
    isPositive?: boolean; // If undefined, inferred from change.value > 0
  };
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "default" | "highlight";
  className?: string;
  footer?: React.ReactNode;
}

export function StatCard({
  title,
  amount,
  formattedValue,
  currency = true,
  change,
  subtitle,
  icon: Icon,
  variant = "default",
  className,
  footer,
}: StatCardProps) {
  const displayValue = formattedValue
    ? formattedValue
    : amount !== undefined
    ? currency
      ? formatCurrency(amount)
      : amount.toLocaleString("en-IN")
    : "—";

  const isPositiveChange =
    change?.isPositive !== undefined
      ? change.isPositive
      : change ? change.value > 0 : undefined;

  return (
    <div
      className={cn(
        "bg-white border border-neutral-200 rounded-lg p-6 sm:p-7 shadow-card transition-all duration-150",
        variant === "highlight" && "border-brand/30 ring-1 ring-brand/10",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-brand tabular-nums">
          {displayValue}
        </div>

        {(change || subtitle) && (
          <div className="mt-2.5 flex items-center flex-wrap gap-x-2 gap-y-1 text-xs">
            {change && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium tabular-nums",
                  isPositiveChange
                    ? "text-financial-positive"
                    : "text-financial-destructive"
                )}
              >
                {isPositiveChange ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {change.value > 0 ? `+${change.value}%` : `${change.value}%`}
              </span>
            )}
            {change?.label && (
              <span className="text-neutral-500">{change.label}</span>
            )}
            {subtitle && !change && (
              <span className="text-neutral-500">{subtitle}</span>
            )}
          </div>
        )}
      </div>

      {footer && <div className="mt-4 pt-3 border-t border-neutral-100 text-xs">{footer}</div>}
    </div>
  );
}
