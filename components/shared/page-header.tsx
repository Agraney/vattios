import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode; // Action buttons / filters
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-brand">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-sm text-neutral-500 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}
