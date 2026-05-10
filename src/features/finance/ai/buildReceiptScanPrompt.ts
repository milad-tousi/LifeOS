import { AiVisionInput } from "@/features/ai/types";
import { FinanceCategory } from "@/features/finance/types/finance.types";
import { Language } from "@/i18n/i18n.types";

interface BuildReceiptScanPromptInput {
  categories: FinanceCategory[];
  currency: string;
  appLanguage: Language;
}

const SYSTEM_PROMPT = [
  "You are a receipt data extraction assistant.",
  "Extract only data that is clearly visible on the receipt.",
  "Do not invent, guess, or fabricate any values.",
  "Return ONLY a valid JSON object — no markdown, no explanation, no text outside the JSON.",
  "If a field is not clearly visible, return null for that field and add a warning string.",
  "The totalAmount must be the final payable total (after tax/discounts), not a subtotal.",
  "Use ISO 8601 date format: YYYY-MM-DD.",
  "If the date is not visible, return null for date.",
  "Do not provide financial advice.",
].join(" ");

export function buildReceiptScanPrompt(input: BuildReceiptScanPromptInput): AiVisionInput {
  const expenseCategories = input.categories
    .filter((c) => c.type !== "income")
    .map((c) => c.name);

  const today = new Date().toISOString().split("T")[0];

  const userPrompt = [
    `Today's date is ${today}. Default currency is ${input.currency}.`,
    "Analyze the receipt image and return a JSON object with this exact schema:",
    JSON.stringify(
      {
        merchant: "string | null — store name from header/logo",
        date: "YYYY-MM-DD | null — transaction date on receipt",
        totalAmount: "number | null — final payable total (positive)",
        currency: `string | null — ISO 4217 code, default ${input.currency} if not shown`,
        categoryName:
          expenseCategories.length > 0
            ? `string | null — best match from: ${expenseCategories.join(", ")}`
            : "string | null — best category guess",
        description: "string | null — short description e.g. 'Groceries at Albert Heijn'",
        lineItems: [
          {
            name: "string",
            quantity: "number",
            amount: "number",
          },
        ],
        confidence: "number — 0.0 to 1.0, your confidence in the extraction",
        warnings: ["string — any unclear or assumed fields"],
      },
      null,
      2,
    ),
    "Rules:",
    "- Extract merchant from the store header/logo/name at the top of the receipt.",
    "- totalAmount is the FINAL total the customer paid, after all taxes and discounts.",
    "- lineItems may be empty array [] if items are not legible.",
    "- confidence reflects overall clarity of the receipt.",
    "- Return ONLY the JSON object, nothing else.",
  ].join("\n");

  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    image: {
      imageBase64: "", // filled by caller
      mimeType: "image/jpeg",
    },
  };
}
