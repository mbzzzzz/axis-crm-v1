import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CurrencyCode } from "./currency-formatter"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse a number value, handling null, undefined, and string inputs
 */
export function safeParseNumber(
  value: number | string | null | undefined,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === "number") {
    return isNaN(value) ? defaultValue : value;
  }
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Format currency with proper localization
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: CurrencyCode = "USD",
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSign?: boolean;
  }
): string {
  const safeAmount = safeParseNumber(amount, 0);
  if (safeAmount === 0 && amount === null) {
    return "—";
  }

  const { minimumFractionDigits = 0, maximumFractionDigits = 0, showSign = false } = options || {};

  try {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(Math.abs(safeAmount));

    if (safeAmount < 0) {
      return `-${formatted}`;
    }
    if (showSign && safeAmount > 0) {
      return `+${formatted}`;
    }
    return formatted;
  } catch (error) {
    console.error("Currency formatting error:", error);
    return `$${safeAmount.toLocaleString()}`;
  }
}

/**
 * Format percentage with proper sign
 */
export function formatPercentage(
  value: number | null | undefined,
  options?: {
    decimals?: number;
    showSign?: boolean;
  }
): string {
  const safeValue = safeParseNumber(value, 0);
  if (safeValue === 0 && value === null) {
    return "—";
  }

  const { decimals = 2, showSign = false } = options || {};
  const formatted = Math.abs(safeValue).toFixed(decimals);

  if (safeValue < 0) {
    return `-${formatted}%`;
  }
  if (showSign && safeValue > 0) {
    return `+${formatted}%`;
  }
  return `${formatted}%`;
}

/**
 * Calculate ROI (Return on Investment)
 * ROI = ((Current Value - Purchase Price) / Purchase Price) × 100
 */
export function calculateROI(
  purchasePrice: number | null | undefined,
  currentValue: number | null | undefined
): number | null {
  const safePurchasePrice = safeParseNumber(purchasePrice, 0);
  const safeCurrentValue = safeParseNumber(currentValue, 0);

  if (safePurchasePrice === 0 || safePurchasePrice === null) {
    return null;
  }

  const roi = ((safeCurrentValue - safePurchasePrice) / safePurchasePrice) * 100;
  return isNaN(roi) || !isFinite(roi) ? null : roi;
}

/**
 * Calculate Gross Profit
 * Gross Profit = Current Value - Purchase Price
 */
export function calculateGrossProfit(
  purchasePrice: number | null | undefined,
  currentValue: number | null | undefined
): number | null {
  const safePurchasePrice = safeParseNumber(purchasePrice, 0);
  const safeCurrentValue = safeParseNumber(currentValue, 0);

  if (safePurchasePrice === null && safeCurrentValue === null) {
    return null;
  }

  return safeCurrentValue - safePurchasePrice;
}

/**
 * Calculate Net Profit
 * Net Profit = Gross Profit - Annual Expenses
 */
export function calculateNetProfit(
  grossProfit: number | null | undefined,
  annualExpenses: number | null | undefined
): number | null {
  if (grossProfit === null || grossProfit === undefined) {
    return null;
  }

  const safeAnnualExpenses = safeParseNumber(annualExpenses, 0);
  return grossProfit - safeAnnualExpenses;
}
