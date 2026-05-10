import { FinanceAnalyticsDashboard } from "@/features/finance/utils/calculateFinanceAnalytics";
import {
  FinanceCategory,
  FinanceCurrency,
  FinanceSummary,
  FinanceTransaction,
  RecurringTransaction,
} from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage } from "@/features/finance/utils/finance.budgets";

export type FinancialAssistantSeverity = "low" | "medium" | "high";
export type FinancialAssistantActionType = "task" | "habit" | "budget" | "review";

export interface FinancialAssistantInsight {
  id: string;
  title: string;
  description: string;
  severity: FinancialAssistantSeverity;
  suggestedAction: string;
  actionType: FinancialAssistantActionType;
}

export interface FinancialAssistantBudgetSuggestion {
  categoryId: string;
  categoryName: string;
  currentSpend: number;
  suggestedBudget: number;
  reason: string;
}

export interface FinancialAssistantQuickAction {
  id: string;
  label: string;
  actionType: FinancialAssistantActionType;
  description?: string;
}

export interface FinancialAssistantSummary {
  score: number;
  scoreReasons: string[];
  insights: FinancialAssistantInsight[];
  budgetSuggestions: FinancialAssistantBudgetSuggestion[];
  quickActions: FinancialAssistantQuickAction[];
}

export interface FinancialAssistantEngineInput {
  analytics: FinanceAnalyticsDashboard;
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  recurringTransactions: RecurringTransaction[];
  summary: FinanceSummary;
  translate: (key: string, values?: Record<string, string | number>) => string;
  transactions: FinanceTransaction[];
}

// ── AI response types ────────────────────────────────────────────────────────

export interface AiFinanceInsight {
  title: string;
  description: string;
  severity: FinancialAssistantSeverity;
  suggestedAction: string;
  actionType: FinancialAssistantActionType;
  confidence: number;
}

export interface AiFinanceTaskAction {
  type: "task";
  title: string;
  description: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  tags: string[];
}

export interface AiFinanceHabitAction {
  type: "habit";
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "custom";
  timeOfDay?: string;
  tags: string[];
}

export interface AiFinanceBudgetAction {
  type: "budget";
  categoryName: string;
  monthlyLimit: number;
  reason: string;
}

export type AiFinanceAction =
  | AiFinanceTaskAction
  | AiFinanceHabitAction
  | AiFinanceBudgetAction;

export interface AiFinanceResponse {
  summary: string;
  scoreAdjustment?: {
    suggestedScore: number;
    reason: string;
  };
  insights: AiFinanceInsight[];
  actions: AiFinanceAction[];
  warnings: string[];
}

export type AiFinanceStatus = "idle" | "loading" | "success" | "error";
