import { generateText } from "@/features/ai/aiClient";
import { AiSettings } from "@/features/ai/types";
import {
  AiFinanceAnalysisSummaryData,
  buildAiFinanceAnalysisPrompt,
} from "@/features/finance/ai/buildFinanceAssistantPrompt";
import {
  AiFinanceAction,
  AiFinanceBudgetAction,
  AiFinanceHabitAction,
  AiFinanceInsight,
  AiFinanceResponse,
  AiFinanceTaskAction,
  FinancialAssistantActionType,
  FinancialAssistantEngineInput,
  FinancialAssistantSeverity,
  FinancialAssistantSummary,
} from "@/features/finance/types/financialAssistant";
import { Language } from "@/i18n/i18n.types";

// ── Build summary data from engine input ─────────────────────────────────────

export function buildAiFinanceSummaryData(
  input: FinancialAssistantEngineInput,
): AiFinanceAnalysisSummaryData {
  const { analytics, budgetUsage, categories, recurringTransactions, transactions } = input;

  // Period info
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const period = {
    start: firstOfMonth.toISOString().split("T")[0],
    end: now.toISOString().split("T")[0],
    label: analytics.periodLabel,
  };

  // Category totals with budget info
  const categoryTotals = analytics.categoryBreakdown
    .slice(0, 8)
    .map((breakdown) => {
      const usage = budgetUsage.find((u) => u.category.id === breakdown.categoryId);
      const category = categories.find((c) => c.id === breakdown.categoryId);
      return {
        categoryName: breakdown.name,
        amount: Math.round(breakdown.value * 100) / 100,
        budget: category?.monthlyBudget,
        budgetUsagePercent: usage ? Math.round(usage.percentageUsed) : undefined,
      };
    });

  // Merchant summary — top 5 by count
  const merchantMap = new Map<string, { count: number; total: number }>();
  transactions
    .filter((tx) => tx.type === "expense" && tx.merchant)
    .forEach((tx) => {
      const key = tx.merchant ?? "Unknown";
      const entry = merchantMap.get(key) ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += tx.amount;
      merchantMap.set(key, entry);
    });
  const merchantSummary = Array.from(merchantMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([merchant, data]) => ({
      merchant,
      count: data.count,
      total: Math.round(data.total * 100) / 100,
    }));

  // Recurring candidates
  const recurringCandidates = recurringTransactions
    .filter((rt) => rt.isActive && rt.type === "expense")
    .slice(0, 5)
    .map((rt) => ({
      description: rt.merchant ?? rt.note ?? "Recurring",
      estimatedMonthly: getRecurringMonthlyAmount(rt),
    }));

  // Budget warnings
  const budgetWarnings = analytics.budgetWarnings.map((w) => ({
    categoryName: w.categoryName,
    percentageUsed: Math.round(w.percentageUsed),
  }));

  // Weekend vs weekday
  const spendingBuckets = transactions.reduce(
    (acc, tx) => {
      if (tx.type !== "expense") return acc;
      const d = new Date(`${tx.date}T12:00:00`);
      if (Number.isNaN(d.getTime())) return acc;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (isWeekend) {
        acc.weekend.sum += tx.amount;
        acc.weekend.count += 1;
      } else {
        acc.weekday.sum += tx.amount;
        acc.weekday.count += 1;
      }
      return acc;
    },
    { weekend: { sum: 0, count: 0 }, weekday: { sum: 0, count: 0 } },
  );
  const weekendAvg = spendingBuckets.weekend.count > 0
    ? Math.round((spendingBuckets.weekend.sum / spendingBuckets.weekend.count) * 100) / 100
    : 0;
  const weekdayAvg = spendingBuckets.weekday.count > 0
    ? Math.round((spendingBuckets.weekday.sum / spendingBuckets.weekday.count) * 100) / 100
    : 0;
  const weekendVsWeekday = {
    weekendAvg,
    weekdayAvg,
    ratio: weekdayAvg > 0 ? Math.round((weekendAvg / weekdayAvg) * 100) / 100 : 1,
  };

  // Monthly comparison (current vs previous)
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyTotals = transactions
    .filter((tx) => tx.type === "expense")
    .reduce(
      (acc, tx) => {
        const monthKey = tx.date.slice(0, 7);
        if (monthKey === currentMonthKey) acc.current += tx.amount;
        if (monthKey === prevMonthKey) acc.previous += tx.amount;
        return acc;
      },
      { current: 0, previous: 0 },
    );
  const changePercent = monthlyTotals.previous > 0
    ? Math.round(((monthlyTotals.current - monthlyTotals.previous) / monthlyTotals.previous) * 100)
    : 0;

  // Current deterministic insights (top 3 for context)
  const currentDeterministicInsights = [] as Array<{ title: string; severity: string; action: string }>;

  return {
    currency: input.currency,
    period,
    totals: {
      income: Math.round(analytics.totalIncome * 100) / 100,
      expenses: Math.round(analytics.totalExpenses * 100) / 100,
      net: Math.round(analytics.netSavings * 100) / 100,
    },
    categoryTotals,
    merchantSummary,
    recurringCandidates,
    budgetWarnings,
    weekendVsWeekday,
    monthlyComparison: {
      currentExpenses: Math.round(monthlyTotals.current * 100) / 100,
      previousExpenses: Math.round(monthlyTotals.previous * 100) / 100,
      changePercent,
    },
    currentDeterministicInsights,
  };
}

// ── Parse + validate AI response ─────────────────────────────────────────────

function isValidSeverity(v: unknown): v is FinancialAssistantSeverity {
  return v === "low" || v === "medium" || v === "high";
}

function isValidActionType(v: unknown): v is FinancialAssistantActionType {
  return v === "task" || v === "habit" || v === "budget" || v === "review";
}

function isValidPriority(v: unknown): v is "low" | "medium" | "high" {
  return v === "low" || v === "medium" || v === "high";
}

function isValidFrequency(v: unknown): v is "daily" | "weekly" | "custom" {
  return v === "daily" || v === "weekly" || v === "custom";
}

function isFutureOrTodayDate(dateStr: unknown): boolean {
  if (typeof dateStr !== "string") return false;
  const today = new Date().toISOString().split("T")[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && dateStr >= today;
}

function parseInsight(raw: unknown, index: number): AiFinanceInsight | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== "string" || !r.title.trim()) return null;
  if (typeof r.description !== "string" || !r.description.trim()) return null;
  if (typeof r.suggestedAction !== "string" || !r.suggestedAction.trim()) return null;
  return {
    title: String(r.title).trim(),
    description: String(r.description).trim(),
    severity: isValidSeverity(r.severity) ? r.severity : "medium",
    suggestedAction: String(r.suggestedAction).trim(),
    actionType: isValidActionType(r.actionType) ? r.actionType : "task",
    confidence: typeof r.confidence === "number" ? Math.max(0, Math.min(1, r.confidence)) : 0.7,
  };
}

function parseAction(raw: unknown): AiFinanceAction | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const type = r.type;

  if (type === "task") {
    if (typeof r.title !== "string" || !r.title.trim()) return null;
    const action: AiFinanceTaskAction = {
      type: "task",
      title: String(r.title).trim(),
      description: typeof r.description === "string" ? r.description.trim() : "",
      priority: isValidPriority(r.priority) ? r.priority : "medium",
      tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string") : ["finance"],
    };
    if (isFutureOrTodayDate(r.dueDate)) {
      action.dueDate = r.dueDate as string;
    }
    return action;
  }

  if (type === "habit") {
    if (typeof r.title !== "string" || !r.title.trim()) return null;
    const action: AiFinanceHabitAction = {
      type: "habit",
      title: String(r.title).trim(),
      description: typeof r.description === "string" ? r.description.trim() : "",
      frequency: isValidFrequency(r.frequency) ? r.frequency : "daily",
      tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string") : ["finance"],
    };
    if (typeof r.timeOfDay === "string" && r.timeOfDay.trim()) {
      action.timeOfDay = r.timeOfDay.trim();
    }
    return action;
  }

  if (type === "budget") {
    if (typeof r.categoryName !== "string" || !r.categoryName.trim()) return null;
    const monthlyLimit = Number(r.monthlyLimit);
    if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0) return null;
    const action: AiFinanceBudgetAction = {
      type: "budget",
      categoryName: String(r.categoryName).trim(),
      monthlyLimit: Math.round(monthlyLimit * 100) / 100,
      reason: typeof r.reason === "string" ? r.reason.trim() : "",
    };
    return action;
  }

  return null;
}

function deduplicateInsights(insights: AiFinanceInsight[]): AiFinanceInsight[] {
  const seen = new Set<string>();
  return insights.filter((i) => {
    const key = i.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateActions(actions: AiFinanceAction[]): AiFinanceAction[] {
  const seen = new Set<string>();
  return actions.filter((a) => {
    const key = a.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseAiResponse(rawText: string): AiFinanceResponse | null {
  // Strip markdown code fences if present
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const r = parsed as Record<string, unknown>;

  const summary = typeof r.summary === "string" ? r.summary.trim() : "";
  if (!summary) return null;

  let scoreAdjustment: AiFinanceResponse["scoreAdjustment"] | undefined;
  if (r.scoreAdjustment && typeof r.scoreAdjustment === "object") {
    const sa = r.scoreAdjustment as Record<string, unknown>;
    const raw = Number(sa.suggestedScore);
    if (Number.isFinite(raw)) {
      scoreAdjustment = {
        suggestedScore: Math.max(0, Math.min(100, Math.round(raw))),
        reason: typeof sa.reason === "string" ? sa.reason.trim() : "",
      };
    }
  }

  const rawInsights = Array.isArray(r.insights) ? r.insights : [];
  const insights = deduplicateInsights(
    rawInsights
      .map((item, i) => parseInsight(item, i))
      .filter((i): i is AiFinanceInsight => i !== null)
      .slice(0, 5),
  );

  const rawActions = Array.isArray(r.actions) ? r.actions : [];
  const actions = deduplicateActions(
    rawActions
      .map(parseAction)
      .filter((a): a is AiFinanceAction => a !== null)
      .slice(0, 4),
  );

  const warnings = Array.isArray(r.warnings)
    ? r.warnings.filter((w): w is string => typeof w === "string")
    : ["This is budgeting guidance only, not financial investment advice."];

  return { summary, scoreAdjustment, insights, actions, warnings };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateAiFinanceAdvice(
  aiSettings: AiSettings,
  input: FinancialAssistantEngineInput,
  deterministicSummary: FinancialAssistantSummary,
  language: Language,
): Promise<AiFinanceResponse> {
  const summaryData = buildAiFinanceSummaryData(input);

  // Inject top deterministic insights as context so AI doesn't duplicate them
  summaryData.currentDeterministicInsights = deterministicSummary.insights
    .slice(0, 3)
    .map((i) => ({ title: i.title, severity: i.severity, action: i.suggestedAction }));

  const messages = buildAiFinanceAnalysisPrompt({
    appLanguage: language,
    currency: input.currency,
    summaryData,
    deterministicScore: deterministicSummary.score,
  });

  const result = await generateText(aiSettings, messages);
  const parsed = parseAiResponse(result.text);

  if (!parsed) {
    throw new Error("AI returned invalid JSON response");
  }

  return parsed;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function getRecurringMonthlyAmount(
  tx: FinancialAssistantEngineInput["recurringTransactions"][number],
): number {
  switch (tx.repeat) {
    case "daily": return tx.amount * 30;
    case "weekly": return tx.amount * 4;
    case "monthly": return tx.amount;
    case "yearly": return tx.amount / 12;
    default: return tx.amount;
  }
}
