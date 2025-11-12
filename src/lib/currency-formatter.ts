export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'SGD' | 'AED' | 'PKR';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  usesIndianNumbering: boolean; // For lakhs/crores system
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', usesIndianNumbering: false },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', usesIndianNumbering: true },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', usesIndianNumbering: false },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', usesIndianNumbering: false },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', usesIndianNumbering: false },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', usesIndianNumbering: false },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', usesIndianNumbering: false },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', usesIndianNumbering: false },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', usesIndianNumbering: false },
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', usesIndianNumbering: true },
};

/**
 * Format number using Indian numbering system (lakhs, crores)
 */
function formatIndianNumbering(value: number): { formatted: string; unit: string } {
  const absValue = Math.abs(value);

  if (absValue >= 10000000) {
    // Crores (1 crore = 10 million)
    return {
      formatted: (value / 10000000).toFixed(2),
      unit: 'Cr',
    };
  } else if (absValue >= 100000) {
    // Lakhs (1 lakh = 100,000)
    return {
      formatted: (value / 100000).toFixed(2),
      unit: 'L',
    };
  } else if (absValue >= 1000) {
    // Thousands
    return {
      formatted: (value / 1000).toFixed(2),
      unit: 'K',
    };
  }

  return {
    formatted: value.toFixed(2),
    unit: '',
  };
}

/**
 * Format number using international numbering system (thousands, millions, billions)
 */
function formatInternationalNumbering(value: number): { formatted: string; unit: string } {
  const absValue = Math.abs(value);

  if (absValue >= 1000000000) {
    // Billions
    return {
      formatted: (value / 1000000000).toFixed(2),
      unit: 'B',
    };
  } else if (absValue >= 1000000) {
    // Millions
    return {
      formatted: (value / 1000000).toFixed(2),
      unit: 'M',
    };
  } else if (absValue >= 1000) {
    // Thousands
    return {
      formatted: (value / 1000).toFixed(2),
      unit: 'K',
    };
  }

  return {
    formatted: value.toFixed(2),
    unit: '',
  };
}

/**
 * Format currency value with dynamic unit detection
 * Automatically switches between units based on value
 */
export function formatCurrency(
  value: number,
  currencyCode: CurrencyCode = 'USD',
  options: {
    showSymbol?: boolean;
    showDecimals?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { showSymbol = true, showDecimals = true, compact = true } = options;
  const currency = CURRENCIES[currencyCode];
  const symbol = showSymbol ? currency.symbol : '';

  if (!compact || value === 0) {
    return `${symbol}${value.toLocaleString('en-US', {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    })}`;
  }

  const { formatted, unit } = currency.usesIndianNumbering
    ? formatIndianNumbering(value)
    : formatInternationalNumbering(value);

  // Remove trailing zeros if not showing decimals
  const cleanFormatted = showDecimals
    ? formatted
    : parseFloat(formatted).toString();

  return unit ? `${symbol}${cleanFormatted} ${unit}` : `${symbol}${cleanFormatted}`;
}

/**
 * Parse formatted currency string back to number
 * Handles formats like "₹50.5 L", "$1.2M", "5000"
 */
export function parseCurrencyValue(input: string, currencyCode: CurrencyCode = 'USD'): number {
  if (!input || input.trim() === '') return 0;

  const currency = CURRENCIES[currencyCode];
  const cleanInput = input
    .replace(/[^\d.,]/g, '') // Remove all non-numeric except . and ,
    .replace(/,/g, ''); // Remove commas

  const numericValue = parseFloat(cleanInput);
  if (isNaN(numericValue)) return 0;

  // Check if input contains unit indicators
  const lowerInput = input.toLowerCase();
  
  if (currency.usesIndianNumbering) {
    if (lowerInput.includes('cr') || lowerInput.includes('crore')) {
      return numericValue * 10000000;
    } else if (lowerInput.includes('l') || lowerInput.includes('lakh')) {
      return numericValue * 100000;
    } else if (lowerInput.includes('k') || lowerInput.includes('thousand')) {
      return numericValue * 1000;
    }
  } else {
    if (lowerInput.includes('b') || lowerInput.includes('billion')) {
      return numericValue * 1000000000;
    } else if (lowerInput.includes('m') || lowerInput.includes('million')) {
      return numericValue * 1000000;
    } else if (lowerInput.includes('k') || lowerInput.includes('thousand')) {
      return numericValue * 1000;
    }
  }

  return numericValue;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: CurrencyCode): string {
  return CURRENCIES[currencyCode].symbol;
}

/**
 * Get suggested unit based on value and currency
 */
export function getSuggestedUnit(value: number, currencyCode: CurrencyCode): string {
  const currency = CURRENCIES[currencyCode];
  const absValue = Math.abs(value);

  if (currency.usesIndianNumbering) {
    if (absValue >= 10000000) return 'Cr';
    if (absValue >= 100000) return 'L';
    if (absValue >= 1000) return 'K';
  } else {
    if (absValue >= 1000000000) return 'B';
    if (absValue >= 1000000) return 'M';
    if (absValue >= 1000) return 'K';
  }

  return '';
}

