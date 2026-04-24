import { FinanceCurrency } from "@/features/finance/types/finance.types";

const CURRENCY_SYMBOLS: Record<FinanceCurrency, string> = {
  EUR: "\u20ac",
  USD: "$",
  GBP: "\u00a3",
  IRR: "\ufdfc",
};

export function getCurrencySymbol(currency: FinanceCurrency): string {
  return CURRENCY_SYMBOLS[currency];
}

export function formatMoney(amount: number, currency: FinanceCurrency): string {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "IRR" ? 0 : 2,
    maximumFractionDigits: currency === "IRR" ? 0 : 2,
  }).format(amount);

  return `${symbol}${formattedAmount}`;
}
