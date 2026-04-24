import { FinanceMerchantRule, VoiceAlias } from "@/features/finance/types/finance.types";

export interface VoiceNormalizationCorrection {
  corrected: string;
  original: string;
  reason: "user-alias" | "known-alias" | "fuzzy-merchant";
}

export interface VoiceNormalizationResult {
  corrections: VoiceNormalizationCorrection[];
  normalizedText: string;
}

const KNOWN_MERCHANT_ALIASES: Record<string, string> = {
  albertine: "Albert Heijn",
  "albert hein": "Albert Heijn",
  "albert heine": "Albert Heijn",
  "albert hijen": "Albert Heijn",
  "albert hijn": "Albert Heijn",
  vomar: "Vomar",
  vomer: "Vomar",
  voma: "Vomar",
  ns: "NS",
  "n s": "NS",
  jumbo: "Jumbo",
  jambo: "Jumbo",
  little: "Lidl",
  lidle: "Lidl",
};

const AMOUNT_SEGMENT_PATTERN =
  /(?:\u20AC|\$|\u00A3)?\s*\d+(?:[.,]\d{1,2})?\s*(?:\u20AC|\$|\u00A3|eur|euro|usd|dollar|gbp|pound|irr|rial)?/i;

export function normalizeVoiceCaptureInput(
  input: string,
  merchantRules: FinanceMerchantRule[],
  voiceAliases: VoiceAlias[] = [],
): VoiceNormalizationResult {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return {
      corrections: [],
      normalizedText: "",
    };
  }

  const userAliasResult = applyUserAliases(trimmedInput, voiceAliases);
  if (userAliasResult.corrections.length > 0) {
    return userAliasResult;
  }

  const { amountSegment, prefix, suffix } = splitAroundAmount(trimmedInput);
  const merchantCandidate = prefix || trimmedInput;
  const normalizedCandidate = sanitizeForMatch(merchantCandidate);

  if (!normalizedCandidate) {
    return {
      corrections: [],
      normalizedText: trimmedInput,
    };
  }

  const aliasMatch = KNOWN_MERCHANT_ALIASES[normalizedCandidate];
  if (aliasMatch) {
    return {
      corrections: [
        {
          corrected: aliasMatch,
          original: merchantCandidate.trim(),
          reason: "known-alias",
        },
      ],
      normalizedText: rebuildNormalizedInput(aliasMatch, amountSegment, suffix, trimmedInput),
    };
  }

  const fuzzyMatch = findBestMerchantRuleMatch(normalizedCandidate, merchantRules);
  if (!fuzzyMatch) {
    return {
      corrections: [],
      normalizedText: trimmedInput,
    };
  }

  return {
    corrections: [
      {
        corrected: fuzzyMatch,
        original: merchantCandidate.trim(),
        reason: "fuzzy-merchant",
      },
    ],
    normalizedText: rebuildNormalizedInput(fuzzyMatch, amountSegment, suffix, trimmedInput),
  };
}

function applyUserAliases(
  input: string,
  voiceAliases: VoiceAlias[],
): VoiceNormalizationResult {
  const sortedAliases = [...voiceAliases].sort(
    (left, right) => right.heardText.trim().length - left.heardText.trim().length,
  );

  for (const voiceAlias of sortedAliases) {
    const heardText = voiceAlias.heardText.trim();
    const correctedText = voiceAlias.correctedText.trim();

    if (!heardText || !correctedText) {
      continue;
    }

    const nextText = replaceAliasInInput(input, heardText, correctedText);
    if (nextText === input) {
      continue;
    }

    return {
      corrections: [
        {
          corrected: correctedText,
          original: heardText,
          reason: "user-alias",
        },
      ],
      normalizedText: nextText,
    };
  }

  return {
    corrections: [],
    normalizedText: input,
  };
}

function rebuildNormalizedInput(
  correctedMerchant: string,
  amountSegment: string,
  suffix: string,
  fallback: string,
): string {
  const parts = [correctedMerchant, amountSegment.trim(), suffix.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ").trim() : fallback.trim();
}

function splitAroundAmount(input: string): {
  amountSegment: string;
  prefix: string;
  suffix: string;
} {
  const amountMatch = input.match(AMOUNT_SEGMENT_PATTERN);

  if (!amountMatch || amountMatch.index === undefined) {
    return {
      amountSegment: "",
      prefix: input.trim(),
      suffix: "",
    };
  }

  return {
    amountSegment: amountMatch[0],
    prefix: input.slice(0, amountMatch.index).trim(),
    suffix: input.slice(amountMatch.index + amountMatch[0].length).trim(),
  };
}

function sanitizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function replaceAliasInInput(
  input: string,
  heardText: string,
  correctedText: string,
): string {
  const normalizedHeardText = heardText.trim();
  if (!normalizedHeardText) {
    return input;
  }

  if (normalizedHeardText.length < 3) {
    const exactTokenPattern = new RegExp(`\\b${escapeRegExp(normalizedHeardText)}\\b`, "i");
    return input.replace(exactTokenPattern, correctedText);
  }

  const flexiblePattern = new RegExp(
    escapeRegExp(normalizedHeardText).replace(/\\ /g, "\\s+"),
    "i",
  );
  return input.replace(flexiblePattern, correctedText);
}

function findBestMerchantRuleMatch(
  merchantCandidate: string,
  merchantRules: FinanceMerchantRule[],
): string | null {
  let bestMatch: { name: string; score: number } | null = null;

  for (const merchantRule of merchantRules) {
    const normalizedRuleName = sanitizeForMatch(merchantRule.name);
    if (!normalizedRuleName) {
      continue;
    }

    const score = getSimilarityScore(merchantCandidate, normalizedRuleName);
    if (score < 0.72) {
      continue;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        name: merchantRule.name,
        score,
      };
    }
  }

  return bestMatch?.name ?? null;
}

function getSimilarityScore(left: string, right: string): number {
  const maxLength = Math.max(left.length, right.length);

  if (maxLength === 0) {
    return 1;
  }

  const distance = getLevenshteinDistance(left, right);
  return 1 - distance / maxLength;
}

function getLevenshteinDistance(left: string, right: string): number {
  const rows = left.length + 1;
  const columns = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(columns).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[rows - 1][columns - 1];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
