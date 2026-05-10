import { FinanceCategory } from "@/features/finance/types/finance.types";

export interface ReceiptLineItem {
  name: string;
  quantity: number;
  amount: number;
}

export interface ReceiptScanResult {
  merchant: string | null;
  date: string | null;
  totalAmount: number | null;
  currency: string | null;
  categoryName: string | null;
  description: string | null;
  lineItems: ReceiptLineItem[];
  confidence: number;
  warnings: string[];
}

export interface MatchedReceiptData {
  merchant: string;
  date: string;
  totalAmount: number;
  currency: string;
  categoryId: string;
  categoryName: string;
  description: string;
  lineItems: ReceiptLineItem[];
  confidence: number;
  warnings: string[];
}

// ── Merchant → category heuristics ───────────────────────────────────────────

const MERCHANT_CATEGORY_HINTS: Array<{ pattern: RegExp; categoryHints: string[] }> = [
  {
    pattern: /albert\s*heijn|jumbo|lidl|aldi|plus|vomar|dirk|ah\b|spar|picnic|boni|coop/i,
    categoryHints: ["grocery", "groceries", "supermarket", "food"],
  },
  {
    pattern: /action\b|hema|primark|amazon|bol\.com|ikea|zara|h&m|uniqlo|zeeman|wibra/i,
    categoryHints: ["shopping"],
  },
  {
    pattern: /ns\b|arriva|connexxion|gvb|ret|movia|bus|tram|metro|train|fuel|shell|bp\b|total\b|esso|tankstation/i,
    categoryHints: ["transport"],
  },
  {
    pattern: /apotheek|pharmacy|huisarts|doctor|tandarts|dentist|ziekenhuis|hospital|etos|kruidvat/i,
    categoryHints: ["health"],
  },
  {
    pattern: /restaurant|cafe|eetcafe|mcdonalds|kfc|subway|dominos|new\s*york\s*pizza|thuisbezorgd|uber\s*eats|deliveroo/i,
    categoryHints: ["food", "dining", "restaurant", "eating"],
  },
  {
    pattern: /bioscoop|cinema|theater|concert|spotify|netflix|disney|steam|pathe/i,
    categoryHints: ["entertainment"],
  },
  {
    pattern: /vodafone|t-mobile|kpn|ziggo|eneco|nuon|vattenfall|energie|internet|provider/i,
    categoryHints: ["bills"],
  },
  {
    pattern: /hotel|booking\.com|airbnb|vliegtuig|flight|ryanair|easyjet|klm\b|transavia/i,
    categoryHints: ["travel"],
  },
];

function guessCategoryFromMerchant(
  merchant: string | null,
  aiCategoryName: string | null,
  categories: FinanceCategory[],
): { categoryId: string; categoryName: string } | null {
  const expenseCategories = categories.filter((c) => c.type !== "income");

  // 1. Try AI-provided category name first
  if (aiCategoryName) {
    const aiMatch = expenseCategories.find(
      (c) => c.name.toLowerCase() === aiCategoryName.toLowerCase(),
    );
    if (aiMatch) return { categoryId: aiMatch.id, categoryName: aiMatch.name };

    // Partial match
    const aiPartial = expenseCategories.find(
      (c) =>
        c.name.toLowerCase().includes(aiCategoryName.toLowerCase()) ||
        aiCategoryName.toLowerCase().includes(c.name.toLowerCase()),
    );
    if (aiPartial) return { categoryId: aiPartial.id, categoryName: aiPartial.name };
  }

  // 2. Try merchant heuristics
  const searchText = `${merchant ?? ""} ${aiCategoryName ?? ""}`.toLowerCase();
  for (const { pattern, categoryHints } of MERCHANT_CATEGORY_HINTS) {
    if (pattern.test(searchText)) {
      for (const hint of categoryHints) {
        const match = expenseCategories.find((c) => c.name.toLowerCase().includes(hint));
        if (match) return { categoryId: match.id, categoryName: match.name };
      }
    }
  }

  // 3. Fall back to first expense category
  if (expenseCategories.length > 0) {
    return { categoryId: expenseCategories[0].id, categoryName: expenseCategories[0].name };
  }

  return null;
}

// ── Parse AI text response ────────────────────────────────────────────────────

export function parseReceiptScanResult(
  rawText: string,
  categories: FinanceCategory[],
  defaultCurrency: string,
): MatchedReceiptData {
  // Strip markdown fences
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned non-JSON response for receipt scan.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI returned unexpected response format.");
  }

  const r = parsed as Record<string, unknown>;

  // Merchant
  const merchant = typeof r.merchant === "string" && r.merchant.trim()
    ? r.merchant.trim()
    : null;

  // Date — validate format, must be valid date
  let date: string | null = null;
  if (typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date)) {
    const d = new Date(`${r.date}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      date = r.date;
    }
  }

  // Total amount — must be positive
  let totalAmount: number | null = null;
  const rawAmount = Number(r.totalAmount);
  if (Number.isFinite(rawAmount) && rawAmount > 0) {
    totalAmount = Math.round(rawAmount * 100) / 100;
  }

  // Currency
  const currency =
    typeof r.currency === "string" && /^[A-Z]{3}$/.test(r.currency.trim())
      ? r.currency.trim()
      : defaultCurrency;

  // Category matching
  const aiCategoryName = typeof r.categoryName === "string" ? r.categoryName.trim() : null;
  const categoryMatch = guessCategoryFromMerchant(merchant, aiCategoryName, categories);

  // Description
  const description =
    typeof r.description === "string" && r.description.trim()
      ? r.description.trim()
      : merchant
        ? `Receipt from ${merchant}`
        : "Scanned receipt";

  // Line items
  const lineItems: ReceiptLineItem[] = [];
  if (Array.isArray(r.lineItems)) {
    for (const item of r.lineItems) {
      if (!item || typeof item !== "object") continue;
      const it = item as Record<string, unknown>;
      const name = typeof it.name === "string" ? it.name.trim() : "";
      const quantity = typeof it.quantity === "number" ? it.quantity : 1;
      const amount = typeof it.amount === "number" ? Math.round(it.amount * 100) / 100 : 0;
      if (name && amount >= 0) {
        lineItems.push({ name, quantity, amount });
      }
    }
  }

  // Confidence
  const confidence =
    typeof r.confidence === "number"
      ? Math.max(0, Math.min(1, r.confidence))
      : 0.5;

  // Warnings
  const warnings: string[] = Array.isArray(r.warnings)
    ? r.warnings.filter((w): w is string => typeof w === "string")
    : [];

  // Build matched data
  return {
    merchant: merchant ?? "",
    date: date ?? new Date().toISOString().split("T")[0],
    totalAmount: totalAmount ?? 0,
    currency,
    categoryId: categoryMatch?.categoryId ?? "",
    categoryName: categoryMatch?.categoryName ?? "",
    description,
    lineItems,
    confidence,
    warnings,
  };
}
