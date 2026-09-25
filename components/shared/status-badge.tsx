import React from "react";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "positive" // Reconciled, Filed, Paid, Received, Matched (Single Green #2E6F40)
  | "warning" // Pending, Unallocated, Action Required, In Review (Amber)
  | "destructive" // Overdue, Mismatched, Rejected, Void (Red)
  | "neutral" // Draft, Archived, Processing, Informational (Slate)
  | "brand"; // System, Active, Primary (Navy)

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  label: string;
  showDot?: boolean;
  size?: "sm" | "md";
}

const variantStyles: Record<
  StatusVariant,
  { container: string; dot: string }
> = {
  positive: {
    container: "bg-financial-positive-bg text-financial-positive-text border-financial-positive-border",
    dot: "bg-financial-positive",
  },
  warning: {
    container: "bg-financial-warning-bg text-financial-warning-text border-financial-warning-border",
    dot: "bg-financial-warning",
  },
  destructive: {
    container: "bg-financial-destructive-bg text-financial-destructive-text border-financial-destructive-border",
    dot: "bg-financial-destructive",
  },
  neutral: {
    container: "bg-neutral-100 text-neutral-600 border-neutral-200",
    dot: "bg-neutral-400",
  },
  brand: {
    container: "bg-brand-subtle text-brand border-neutral-300",
    dot: "bg-brand",
  },
};

export function StatusBadge({
  variant = "neutral",
  label,
  showDot = true,
  size = "md",
  className,
  ...props
}: StatusBadgeProps) {
  const styles = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
        styles.container,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            "rounded-full shrink-0",
            size === "sm" ? "w-1.5 h-1.5" : "w-1.5 h-1.5",
            styles.dot
          )}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}
