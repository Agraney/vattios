import React from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (item: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  width?: string;
}

export interface DataTableShellProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string | number;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  onRowClick?: (item: T) => void;
  footerSummary?: React.ReactNode;
}

export function DataTableShell<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No records found.",
  emptyAction,
  isLoading = false,
  className,
  onRowClick,
  footerSummary,
}: DataTableShellProps<T>) {
  return (
    <div
      className={cn(
        "bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{ width: col.width }}
                  className={cn(
                    "py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-neutral-400 font-medium"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                    <span>Loading financial records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-neutral-500"
                >
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <p className="text-sm font-medium text-neutral-600">{emptyMessage}</p>
                    {emptyAction && <div className="mt-3">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => {
                const key = keyExtractor
                  ? keyExtractor(item, rowIdx)
                  : (item as unknown as { id?: string | number })?.id ?? rowIdx;

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "transition-colors duration-75",
                      onRowClick
                        ? "cursor-pointer hover:bg-neutral-50/80"
                        : "hover:bg-neutral-50/50"
                    )}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={cn(
                          "py-3.5 px-4 text-neutral-700 whitespace-nowrap",
                          col.align === "right" && "text-right tabular-nums",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(item, rowIdx)
                          : col.accessorKey
                          ? String(item[col.accessorKey] ?? "—")
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {footerSummary && (
        <div className="bg-neutral-50/70 border-t border-neutral-200 px-4 py-3 text-xs text-neutral-600">
          {footerSummary}
        </div>
      )}
    </div>
  );
}
