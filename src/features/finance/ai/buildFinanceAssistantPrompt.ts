import { AiMessage } from "@/features/ai/types";
import { FinancialAssistantSummary } from "@/features/finance/types/financialAssistant";
import { Language } from "@/i18n/i18n.types";

// ── Existing Q&A prompt (unchanged) ─────────────────────────────────────────

interface BuildFinanceAssistantPromptInput {
  appLanguage: Language;
  currency: string;
  financeSummary: FinancialAssistantSummary;
  periodLabel: string;
  question: string;
  snapshot: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    topCategories: Array<{ name: string; value: number; percentage: number }>;
    recurringMonthlyExpenses: number;
    recurringMonthlyIncome: number;
  };
}

export function buildFinanceAssistantPrompt(
  input: BuildFinanceAssistantPromptInput,
): AiMessage[] {
  const languageInstruction =
    input.appLanguage === "fa"
      ? "Respond in Persian/Farsi."
      : "Respond in English.";

  return [
    {
      role: "system",
      content: [
        "You are LifeOS Financial Assistant.",
        languageInstruction,
        "Use only the summarized finance analytics provided by the app.",
        "Do not ask for or infer hidden data.",
        "Do not give investment advice.",
        "Do not recommend specific stocks, crypto, trading strategies, loans, tax strategies, or legal actions.",
        "Only provide budgeting, saving, expense organization, recurring payment cleanup, and financial habit suggestions.",
        "Keep the answer practical, short, and action-oriented.",
        "If the user asks for investing, taxes, law, debt strategy, or regulated financial advice, gently refuse and redirect to budgeting and organization help.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          currency: input.currency,
          periodLabel: input.periodLabel,
          financialHealthScore: input.financeSummary.score,
          scoreReasons: input.financeSummary.scoreReasons,
          insights: input.financeSummary.insights.map((insight) => ({
            action: insight.suggestedAction,
            description: insight.description,
            severity: insight.severity,
            title: insight.title,
          })),
          budgetSuggestions: input.financeSummary.budgetSuggestions.map((suggestion) => ({
            category: suggestion.categoryName,
            currentSpend: suggestion.currentSpend,
            reason: suggestion.reason,
            suggestedBudget: suggestion.suggestedBudget,
          })),
          totals: input.snapshot,
          question: input.question.trim(),
          responseRules: [
            "Answer with 2 to 5 concise bullet points or a short paragraph plus bullets.",
            "Stay at personal budgeting and spending-organization level.",
            "Do not overstate certainty.",
          ],
        },
        null,
        2,
      ),
    },
  ];
}

// ── AI analysis prompt (structured JSON output) ──────────────────────────────

export interface AiFinanceAnalysisSummaryData {
  currency: string;
  period: { start: string; end: string; label: string };
  totals: { income: number; expenses: number; net: number };
  categoryTotals: Array<{
    categoryName: string;
    amount: number;
    budget?: number;
    budgetUsagePercent?: number;
  }>;
  merchantSummary: Array<{ merchant: string; count: number; total: number }>;
  recurringCandidates: Array<{ description: string; estimatedMonthly: number }>;
  budgetWarnings: Array<{ categoryName: string; percentageUsed: number }>;
  weekendVsWeekday: { weekendAvg: number; weekdayAvg: number; ratio: number };
  monthlyComparison: { currentExpenses: number; previousExpenses: number; changePercent: number };
  currentDeterministicInsights: Array<{ title: string; severity: string; action: string }>;
}

interface BuildAiFinanceAnalysisPromptInput {
  appLanguage: Language;
  currency: string;
  summaryData: AiFinanceAnalysisSummaryData;
  deterministicScore: number;
}

const SAFETY_RULES = [
  "This is personal budgeting guidance only. Never recommend stocks, crypto, trading strategies, specific investments, loans, debt restructuring, tax strategies, or legal actions.",
  "Keep all suggestions limited to: budgeting, expense control, recurring payment review, saving habits, personal organization, spending awareness, and practical financial routines.",
  "If any insight would require regulated financial advice, replace it with a safe budgeting alternative.",
  "Do not invent financial data that was not provided.",
  "Budget monthlyLimit values must be positive and based on the provided spending data. Do not set unrealistic zero values.",
  "dueDate must be today or a future date in YYYY-MM-DD format.",
  "habit frequency must be one of: daily, weekly, custom.",
];

export function buildAiFinanceAnalysisPrompt(
  input: BuildAiFinanceAnalysisPromptInput,
): AiMessage[] {
  const languageInstruction =
    input.appLanguage === "fa"
      ? "Write all text fields (summary, titles, descriptions, reasons) in Persian/Farsi."
      : "Write all text fields in English.";

  const today = new Date().toISOString().split("T")[0];

  return [
    {
      role: "system",
      content: [
        "You are LifeOS Financial Assistant — a personal finance coach built into a life management app.",
        languageInstruction,
        "Analyze the summarized finance data provided and return ONLY a valid JSON object matching the exact schema specified.",
        "Do not add any text, explanation, or markdown outside the JSON.",
        ...SAFETY_RULES,
        `Today's date is ${today}.`,
        "Return ONLY raw JSON — no markdown code fences, no preamble, no explanation.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "Analyze this summarized finance data and return structured recommendations.",
          financeData: input.summaryData,
          deterministicHealthScore: input.deterministicScore,
          requiredOutputSchema: {
            summary: "string — 1-2 friendly sentences summarizing financial status",
            scoreAdjustment: {
              suggestedScore: "number 0-100",
              reason: "string — why you adjusted the score",
            },
            insights: [
              {
                title: "string",
                description: "string",
                severity: "low | medium | high",
                suggestedAction: "string",
                actionType: "task | habit | budget | review",
                confidence: "number 0.0 to 1.0",
              },
            ],
            actions: [
              {
                _comment_task:
                  "type=task example",
                type: "task",
                title: "string",
                description: "string",
                dueDate: "YYYY-MM-DD (today or future)",
                priority: "low | medium | high",
                tags: ["finance"],
              },
              {
                _comment_habit: "type=habit example",
                type: "habit",
                title: "string",
                description: "string",
                frequency: "daily | weekly | custom",
                timeOfDay: "morning | afternoon | evening (optional)",
                tags: ["finance"],
              },
              {
                _comment_budget: "type=budget example",
                type: "budget",
                categoryName: "string — must match an existing category name from the data",
                monthlyLimit: "positive number based on recent spending",
                reason: "string",
              },
            ],
            warnings: [
              "This is budgeting guidance only, not financial investment advice.",
            ],
          },
          rules: [
            "Return 2-4 insights maximum.",
            "Return 2-4 actions maximum (mix of task, habit, budget types).",
            "Only suggest budget actions for categories present in the provided categoryTotals.",
            "Do not duplicate insights already obvious from deterministicInsights.",
            "Be concise and practical.",
          ],
        },
        null,
        2,
      ),
    },
  ];
}
