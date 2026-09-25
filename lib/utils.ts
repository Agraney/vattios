import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric value into Indian Rupee currency string (e.g. ₹1,23,456)
 * Uses Intl.NumberFormat('en-IN', ...) to strictly adhere to Indian lakh/crore digit grouping.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: {
    decimals?: number;
    showSymbol?: boolean;
    compact?: boolean;
    showSign?: boolean;
  } = {}
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return options.showSymbol !== false ? "₹0" : "0";
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const decimals = options.decimals !== undefined ? options.decimals : 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  if (options.compact) {
    if (absNum >= 10000000) {
      const cr = (absNum / 10000000).toFixed(decimals > 0 ? decimals : 2);
      const formatted = `${options.showSymbol !== false ? "₹" : ""}${cr} Cr`;
      return isNegative ? `-${formatted}` : options.showSign ? `+${formatted}` : formatted;
    }
    if (absNum >= 100000) {
      const l = (absNum / 100000).toFixed(decimals > 0 ? decimals : 2);
      const formatted = `${options.showSymbol !== false ? "₹" : ""}${l} L`;
      return isNegative ? `-${formatted}` : options.showSign ? `+${formatted}` : formatted;
    }
  }

  const formatter = new Intl.NumberFormat("en-IN", {
    style: options.showSymbol !== false ? "currency" : "decimal",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const formatted = formatter.format(absNum);

  if (isNegative) {
    return `-${formatted}`;
  }
  if (options.showSign && num > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

/**
 * Format raw numbers with Indian comma grouping (e.g. 12,34,567)
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined || isNaN(Number(value))) return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format percentages (e.g. +12.4% or -3.2%)
 */
export function formatPercent(
  value: number,
  options: { decimals?: number; showSign?: boolean } = {}
): string {
  const { decimals = 1, showSign = true } = options;
  const formatted = `${Math.abs(value).toFixed(decimals)}%`;
  if (value < 0) return `-${formatted}`;
  if (showSign && value > 0) return `+${formatted}`;
  return formatted;
}
