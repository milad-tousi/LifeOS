import { generateVision } from "@/features/ai/aiClient";
import { AiSettings, isVisionCapable } from "@/features/ai/types";
import { buildReceiptScanPrompt } from "@/features/finance/ai/buildReceiptScanPrompt";
import {
  MatchedReceiptData,
  parseReceiptScanResult,
} from "@/features/finance/ai/parseReceiptScanResult";
import { FinanceCategory } from "@/features/finance/types/finance.types";
import { Language } from "@/i18n/i18n.types";

interface ScanReceiptInput {
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  categories: FinanceCategory[];
  currency: string;
  appLanguage: Language;
}

export async function scanReceiptWithAi(
  settings: AiSettings,
  input: ScanReceiptInput,
): Promise<MatchedReceiptData> {
  if (!isVisionCapable(settings)) {
    throw new VisionNotSupportedError(
      `The model "${settings.model}" does not appear to support vision/image input.`,
    );
  }

  const promptTemplate = buildReceiptScanPrompt({
    categories: input.categories,
    currency: input.currency,
    appLanguage: input.appLanguage,
  });

  const visionInput = {
    ...promptTemplate,
    image: {
      imageBase64: input.imageBase64,
      mimeType: input.mimeType,
    },
  };

  const result = await generateVision(settings, visionInput);

  return parseReceiptScanResult(result.text, input.categories, input.currency);
}

export class VisionNotSupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VisionNotSupportedError";
  }
}
