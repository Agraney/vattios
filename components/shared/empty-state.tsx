import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-dashed border-neutral-300 rounded-lg",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-brand">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
