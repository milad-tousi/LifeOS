import {
  SmartRule,
  SmartRuleCondition,
  TransactionType,
} from "@/features/finance/types/finance.types";

export interface SmartRuleTransactionDraft {
  amount?: number;
  appliedSmartRuleId?: string;
  appliedSmartRuleName?: string;
  categoryId?: string;
  merchant?: string;
  note?: string;
  type?: TransactionType;
}

export function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function evaluateCondition(
  transactionDraft: SmartRuleTransactionDraft,
  condition: SmartRuleCondition,
): boolean {
  if (!condition || typeof condition !== "object") {
    return false;
  }

  const rawConditionValue = condition.value;
  if (
    (typeof rawConditionValue === "string" && rawConditionValue.trim() === "") ||
    rawConditionValue === null ||
    rawConditionValue === undefined
  ) {
    return false;
  }

  const fieldValue = transactionDraft[condition.field];

  if (condition.field === "amount") {
    const draftAmount = Number(fieldValue);
    const conditionAmount = Number(rawConditionValue);

    if (!Number.isFinite(draftAmount) || !Number.isFinite(conditionAmount)) {
      return false;
    }

    switch (condition.operator) {
      case "equals":
        return draftAmount === conditionAmount;
      case "greaterThan":
        return draftAmount > conditionAmount;
      case "lessThan":
        return draftAmount < conditionAmount;
      default:
        return false;
    }
  }

  const normalizedFieldValue = normalizeText(fieldValue);
  const normalizedConditionValue = normalizeText(rawConditionValue);

  if (!normalizedFieldValue || !normalizedConditionValue) {
    return false;
  }

  switch (condition.operator) {
    case "contains":
      return normalizedFieldValue.includes(normalizedConditionValue);
    case "equals":
      return normalizedFieldValue === normalizedConditionValue;
    case "startsWith":
      return normalizedFieldValue.startsWith(normalizedConditionValue);
    case "endsWith":
      return normalizedFieldValue.endsWith(normalizedConditionValue);
    default:
      return false;
  }
}

export function evaluateSmartRule(
  transactionDraft: SmartRuleTransactionDraft,
  rule: SmartRule,
): boolean {
  if (
    !rule ||
    !rule.isActive ||
    !Array.isArray(rule.conditions) ||
    rule.conditions.length === 0
  ) {
    return false;
  }

  const evaluations = rule.conditions.map((condition) =>
    evaluateCondition(transactionDraft, condition),
  );

  if (rule.matchMode === "all") {
    return evaluations.every(Boolean);
  }

  if (rule.matchMode === "any") {
    return evaluations.some(Boolean);
  }

  return false;
}

export function findMatchingSmartRule(
  transactionDraft: SmartRuleTransactionDraft,
  rules: SmartRule[],
): SmartRule | null {
  if (!Array.isArray(rules) || rules.length === 0) {
    return null;
  }

  const sortedRules = [...rules]
    .filter((rule) => rule.isActive)
    .sort((left, right) => left.priority - right.priority);

  return sortedRules.find((rule) => evaluateSmartRule(transactionDraft, rule)) ?? null;
}

export function applySmartRule(
  transactionDraft: SmartRuleTransactionDraft,
  rule: SmartRule,
): SmartRuleTransactionDraft {
  if (!rule || !rule.action || typeof rule.action !== "object") {
    return transactionDraft;
  }

  const nextDraft: SmartRuleTransactionDraft = {
    ...transactionDraft,
    appliedSmartRuleId: rule.id,
    appliedSmartRuleName: rule.name,
  };

  if (rule.action.type) {
    nextDraft.type = rule.action.type;
  }

  if (rule.action.categoryId) {
    nextDraft.categoryId = rule.action.categoryId;
  }

  if (rule.action.notePrefix) {
    const trimmedPrefix = rule.action.notePrefix.trim();
    const currentNote = transactionDraft.note?.trim() ?? "";
    const normalizedPrefix = normalizeText(trimmedPrefix);
    const normalizedCurrentNote = normalizeText(currentNote);

    if (!normalizedCurrentNote) {
      nextDraft.note = trimmedPrefix;
    } else if (!normalizedCurrentNote.startsWith(normalizedPrefix)) {
      nextDraft.note = `${trimmedPrefix} ${currentNote}`.trim();
    }
  }

  return nextDraft;
}

export function applySmartRules(
  transactionDraft: SmartRuleTransactionDraft,
  rules: SmartRule[],
): SmartRuleTransactionDraft {
  const matchedRule = findMatchingSmartRule(transactionDraft, rules);

  if (!matchedRule) {
    return {
      ...transactionDraft,
      appliedSmartRuleId: undefined,
      appliedSmartRuleName: undefined,
    };
  }

  return applySmartRule(transactionDraft, matchedRule);
}
