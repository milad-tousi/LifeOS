import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { TaskModal } from "@/features/tasks/components/AddTaskModal";
import { generateText } from "@/features/ai/aiClient";
import { getAiSettings, useAiSettings } from "@/features/ai/aiSettingsStore";
import { buildFinanceAssistantPrompt } from "@/features/finance/ai/buildFinanceAssistantPrompt";
import { generateAiFinanceAdvice } from "@/features/finance/ai/generateAiFinanceAdvice";
import { generateFinancialAssistantSummary } from "@/features/finance/services/financialAssistantEngine";
import { AiFinanceActionCard } from "@/features/finance/components/AiFinanceActionCard";
import { AiFinanceStatusCard } from "@/features/finance/components/AiFinanceStatusCard";
import { FinanceActionConfirmModal } from "@/features/finance/components/FinanceActionConfirmModal";
import {
  AiFinanceAction,
  AiFinanceBudgetAction,
  AiFinanceHabitAction,
  AiFinanceResponse,
  AiFinanceStatus,
  AiFinanceTaskAction,
  FinancialAssistantEngineInput,
  FinancialAssistantInsight,
} from "@/features/finance/types/financialAssistant";
import { FinanceCategory } from "@/features/finance/types/finance.types";
import { formatMoney } from "@/features/finance/utils/finance.format";
import { formatNumber } from "@/i18n/formatters";
import { useI18n } from "@/i18n";

interface FinancialAssistantTabProps extends FinancialAssistantEngineInput {
  onOpenSettings: () => void;
  onUpdateCategory: (category: FinanceCategory) => void;
}

interface TaskDraftState {
  description: string;
  title: string;
}

export function FinancialAssistantTab({
  analytics,
  budgetUsage,
  categories,
  currency,
  onOpenSettings,
  onUpdateCategory,
  recurringTransactions,
  summary,
  transactions,
}: FinancialAssistantTabProps): JSX.Element {
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const { settings: aiSettings } = useAiSettings();

  // ── Deterministic engine ─────────────────────────────────────────────────
  const assistantSummary = useMemo(
    () =>
      generateFinancialAssistantSummary({
        analytics,
        budgetUsage,
        categories,
        currency,
        recurringTransactions,
        summary,
        translate: t,
        transactions,
      }),
    [analytics, budgetUsage, categories, currency, recurringTransactions, summary, t, transactions],
  );

  // ── UI state ─────────────────────────────────────────────────────────────
  const [ignoredInsightIds, setIgnoredInsightIds] = useState<string[]>([]);
  const [taskDraft, setTaskDraft] = useState<TaskDraftState | null>(null);
  const [question, setQuestion] = useState("");
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [questionStatus, setQuestionStatus] = useState<"idle" | "loading" | "error">("idle");
  const [questionMessage, setQuestionMessage] = useState("");

  // ── AI analysis state ────────────────────────────────────────────────────
  const [aiStatus, setAiStatus] = useState<AiFinanceStatus>("idle");
  const [aiResponse, setAiResponse] = useState<AiFinanceResponse | null>(null);
  const [aiError, setAiError] = useState("");
  const [pendingAction, setPendingAction] = useState<AiFinanceAction | null>(null);

  const visibleInsights = useMemo(
    () =>
      assistantSummary.insights.filter((insight) => !ignoredInsightIds.includes(insight.id)),
    [assistantSummary.insights, ignoredInsightIds],
  );
  const actionInsights = visibleInsights.slice(0, 4);
  const hasFinanceData = transactions.length > 0;

  const canUseAi =
    aiSettings.enabled &&
    aiSettings.baseUrl.trim() !== "" &&
    aiSettings.model.trim() !== "";

  // ── Handlers ─────────────────────────────────────────────────────────────

  function openTaskDraft(title: string, description: string): void {
    setTaskDraft({ description, title });
  }

  function ignoreInsight(id: string): void {
    setIgnoredInsightIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }

  async function handleAnalyzeWithAi(): Promise<void> {
    if (!canUseAi) return;
    setAiStatus("loading");
    setAiError("");
    setAiResponse(null);
    try {
      const settings = await getAiSettings();
      const response = await generateAiFinanceAdvice(
        settings,
        { analytics, budgetUsage, categories, currency, recurringTransactions, summary, translate: t, transactions },
        assistantSummary,
        language,
      );
      setAiResponse(response);
      setAiStatus("success");
    } catch {
      setAiStatus("error");
      setAiError(t("finance.assistant.ai.analyzeError"));
    }
  }

  async function handleAskAssistant(): Promise<void> {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;
    if (!aiSettings.enabled) {
      setQuestionStatus("error");
      setQuestionMessage(t("finance.assistant.aiDisabled"));
      setQuestionAnswer("");
      return;
    }
    if (!canUseAi) {
      setQuestionStatus("error");
      setQuestionMessage(t("finance.assistant.aiIncomplete"));
      setQuestionAnswer("");
      return;
    }
    setQuestionStatus("loading");
    setQuestionMessage("");
    try {
      const settings = await getAiSettings();
      const result = await generateText(
        settings,
        buildFinanceAssistantPrompt({
          appLanguage: language,
          currency,
          financeSummary: assistantSummary,
          periodLabel: analytics.periodLabel,
          question: trimmedQuestion,
          snapshot: {
            totalIncome: analytics.totalIncome,
            totalExpenses: analytics.totalExpenses,
            netSavings: analytics.netSavings,
            recurringMonthlyExpenses: recurringTransactions
              .filter((tx) => tx.isActive && tx.type === "expense")
              .reduce((sum, tx) => sum + tx.amount, 0),
            recurringMonthlyIncome: recurringTransactions
              .filter((tx) => tx.isActive && tx.type === "income")
              .reduce((sum, tx) => sum + tx.amount, 0),
            topCategories: analytics.categoryBreakdown.slice(0, 4).map((item) => ({
              name: item.name,
              percentage: item.percentage,
              value: item.value,
            })),
          },
        }),
      );
      setQuestionStatus("idle");
      setQuestionAnswer(result.text.trim());
    } catch {
      setQuestionStatus("error");
      setQuestionMessage(t("finance.assistant.askError"));
      setQuestionAnswer("");
    }
  }

  // ── Action card handlers ─────────────────────────────────────────────────

  function handleCreateTask(action: AiFinanceTaskAction): void {
    setPendingAction(action);
  }

  function handleCreateHabit(action: AiFinanceHabitAction): void {
    setPendingAction(action);
  }

  function handleCreateBudget(action: AiFinanceBudgetAction): void {
    setPendingAction(action);
  }

  function handleClosePendingAction(): void {
    setPendingAction(null);
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (!hasFinanceData) {
    return (
      <div className="finance-tab-panel">
        <Card
          subtitle={t("finance.assistant.emptyDescription")}
          title={t("finance.assistant.emptyTitle")}
        >
          <div className="finance-chart-empty finance-chart-empty--roomy">
            <strong>{t("finance.assistant.emptyTitle")}</strong>
            <p>{t("finance.assistant.emptyDescription")}</p>
          </div>
        </Card>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="finance-tab-panel finance-assistant">

      {/* AI Status Card */}
      <AiFinanceStatusCard
        aiEnabled={aiSettings.enabled}
        aiConfigured={canUseAi}
        status={aiStatus}
        errorMessage={aiError}
        onAnalyze={() => { void handleAnalyzeWithAi(); }}
        onOpenSettings={onOpenSettings}
      />

      {/* AI Analysis Results */}
      {aiStatus === "success" && aiResponse ? (
        <>
          <Card
            title={t("finance.assistant.ai.resultTitle")}
            subtitle={t("finance.assistant.ai.resultSubtitle")}
          >
            <div className="finance-assistant__ai-result">
              <div className="finance-assistant__answer-header">
                <Sparkles size={16} />
                <strong>{t("finance.assistant.ai.summaryLabel")}</strong>
              </div>
              <p>{aiResponse.summary}</p>
              {aiResponse.scoreAdjustment ? (
                <p className="finance-assistant__ai-score-note">
                  {t("finance.assistant.ai.suggestedScore")}{" "}
                  <strong>{aiResponse.scoreAdjustment.suggestedScore}</strong>
                  {" — "}
                  {aiResponse.scoreAdjustment.reason}
                </p>
              ) : null}
              {aiResponse.warnings.length > 0 ? (
                <p className="finance-assistant__ai-warning">
                  ⚠️ {aiResponse.warnings[0]}
                </p>
              ) : null}
            </div>
          </Card>

          {aiResponse.insights.length > 0 ? (
            <Card
              title={t("finance.assistant.ai.insightsTitle")}
              subtitle={t("finance.assistant.ai.insightsSubtitle")}
            >
              <div className="finance-assistant__insights">
                {aiResponse.insights.map((insight, idx) => (
                  <article
                    className="finance-assistant__insight-card"
                    key={`ai-insight-${idx}`}
                  >
                    <div className="finance-assistant__insight-header">
                      <div>
                        <strong>{insight.title}</strong>
                        <p>{insight.description}</p>
                      </div>
                      <span
                        className={`finance-assistant__severity finance-assistant__severity--${insight.severity}`}
                      >
                        {t(`finance.assistant.severity.${insight.severity}`)}
                      </span>
                    </div>
                    <div className="finance-assistant__insight-footer">
                      <p>{insight.suggestedAction}</p>
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          ) : null}

          {aiResponse.actions.length > 0 ? (
            <Card
              title={t("finance.assistant.ai.actionsTitle")}
              subtitle={t("finance.assistant.ai.actionsSubtitle")}
            >
              <div className="finance-assistant__actions">
                {aiResponse.actions.map((action, idx) => (
                  <AiFinanceActionCard
                    action={action}
                    currency={currency}
                    key={`ai-action-${idx}`}
                    onCreateBudget={handleCreateBudget}
                    onCreateHabit={handleCreateHabit}
                    onCreateTask={handleCreateTask}
                  />
                ))}
              </div>
            </Card>
          ) : null}
        </>
      ) : null}

      {/* ── Deterministic health score ────────────────────────────────────── */}
      <Card
        subtitle={t("finance.assistant.subtitle")}
        title={t("finance.assistant.title")}
      >
        <div className="finance-assistant__score-card">
          <div className="finance-assistant__score-ring">
            <strong>{formatNumber(assistantSummary.score, language)}</strong>
            <span>{t("finance.assistant.scoreLabel")}</span>
          </div>
          <div className="finance-assistant__score-copy">
            <h3>{t("finance.assistant.healthScoreTitle")}</h3>
            <p>{t("finance.assistant.healthScoreDescription")}</p>
            <ul className="finance-assistant__reason-list">
              {assistantSummary.scoreReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* ── Insights ─────────────────────────────────────────────────────── */}
      <Card
        subtitle={t("finance.assistant.insightsDescription")}
        title={t("finance.assistant.insightsTitle")}
      >
        <div className="finance-assistant__insights">
          {visibleInsights.length > 0 ? (
            visibleInsights.map((insight) => (
              <article className="finance-assistant__insight-card" key={insight.id}>
                <div className="finance-assistant__insight-header">
                  <div>
                    <strong>{insight.title}</strong>
                    <p>{insight.description}</p>
                  </div>
                  <span
                    className={`finance-assistant__severity finance-assistant__severity--${insight.severity}`}
                  >
                    {t(`finance.assistant.severity.${insight.severity}`)}
                  </span>
                </div>
                <div className="finance-assistant__insight-footer">
                  <p>{insight.suggestedAction}</p>
                  <div className="finance-assistant__inline-actions">
                    <Button
                      onClick={() =>
                        openTaskDraft(insight.title, buildTaskDescription(insight))
                      }
                      type="button"
                      variant="secondary"
                    >
                      {t("finance.assistant.createTask")}
                    </Button>
                    <Button
                      onClick={() => ignoreInsight(insight.id)}
                      type="button"
                      variant="ghost"
                    >
                      {t("finance.assistant.ignore")}
                    </Button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="finance-chart-empty">
              <strong>{t("finance.assistant.noInsightsTitle")}</strong>
              <p>{t("finance.assistant.noInsightsDescription")}</p>
            </div>
          )}
        </div>
      </Card>

      {/* ── Recommended actions ──────────────────────────────────────────── */}
      <Card
        subtitle={t("finance.assistant.actionsDescription")}
        title={t("finance.assistant.actionsTitle")}
      >
        <div className="finance-assistant__actions">
          {actionInsights.map((insight) => (
            <article
              className="finance-assistant__action-card"
              key={`action-${insight.id}`}
            >
              <div>
                <strong>{insight.title}</strong>
                <p>{insight.suggestedAction}</p>
              </div>
              <div className="finance-assistant__action-buttons">
                <Button
                  onClick={() =>
                    openTaskDraft(insight.title, buildTaskDescription(insight))
                  }
                  type="button"
                  variant="secondary"
                >
                  {t("finance.assistant.createTask")}
                </Button>
                <Button
                  onClick={() => navigate("/habits")}
                  type="button"
                  variant="ghost"
                >
                  {t("finance.assistant.createHabit")}
                </Button>
                <Button
                  onClick={onOpenSettings}
                  type="button"
                  variant="ghost"
                >
                  {t("finance.assistant.createBudget")}
                </Button>
                <Button
                  onClick={() => ignoreInsight(insight.id)}
                  type="button"
                  variant="ghost"
                >
                  {t("finance.assistant.ignore")}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Card>

      {/* ── Budget suggestions ───────────────────────────────────────────── */}
      <Card
        subtitle={t("finance.assistant.budgetSuggestionsDescription")}
        title={t("finance.assistant.budgetSuggestionsTitle")}
      >
        <div className="finance-assistant__budget-list">
          {assistantSummary.budgetSuggestions.length > 0 ? (
            assistantSummary.budgetSuggestions.map((suggestion) => (
              <article
                className="finance-assistant__budget-card"
                key={suggestion.categoryId}
              >
                <div className="finance-assistant__budget-topline">
                  <strong>{suggestion.categoryName}</strong>
                  <span>{t("finance.assistant.suggestedBudgetLabel")}</span>
                </div>
                <div className="finance-assistant__budget-meta">
                  <span>
                    {t("finance.assistant.currentSpendLabel")}{" "}
                    {formatMoney(suggestion.currentSpend, currency)}
                  </span>
                  <b>{formatMoney(suggestion.suggestedBudget, currency)}</b>
                </div>
                <p>{suggestion.reason}</p>
                <div className="finance-assistant__inline-actions">
                  <Button onClick={onOpenSettings} type="button" variant="secondary">
                    {t("finance.assistant.createBudget")}
                  </Button>
                  <Button
                    onClick={() =>
                      openTaskDraft(
                        t("finance.assistant.adjustBudgetTaskTitle").replace(
                          "{category}",
                          suggestion.categoryName,
                        ),
                        t("finance.assistant.adjustBudgetTaskDescription")
                          .replace("{category}", suggestion.categoryName)
                          .replace(
                            "{amount}",
                            formatMoney(suggestion.suggestedBudget, currency),
                          ),
                      )
                    }
                    type="button"
                    variant="ghost"
                  >
                    {t("finance.assistant.createTask")}
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <div className="finance-chart-empty">
              <strong>{t("finance.assistant.noBudgetSuggestionsTitle")}</strong>
              <p>{t("finance.assistant.noBudgetSuggestionsDescription")}</p>
            </div>
          )}
        </div>
      </Card>

      {/* ── Ask assistant ────────────────────────────────────────────────── */}
      <Card
        subtitle={t("finance.assistant.askDescription")}
        title={t("finance.assistant.askTitle")}
      >
        <div className="finance-assistant__ask">
          <div className="finance-assistant__ask-row">
            <label className="auth-form__field finance-assistant__ask-field">
              <span className="auth-form__label">{t("finance.assistant.askLabel")}</span>
              <div className="finance-assistant__ask-input-wrap">
                <input
                  className="auth-form__input finance-assistant__ask-input"
                  disabled={questionStatus === "loading"}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && question.trim() && questionStatus !== "loading") {
                      void handleAskAssistant();
                    }
                  }}
                  placeholder={t("finance.assistant.askPlaceholder")}
                  type="text"
                  value={question}
                />
                <button
                  className="finance-assistant__ask-send"
                  disabled={questionStatus === "loading" || question.trim() === ""}
                  onClick={() => { void handleAskAssistant(); }}
                  type="button"
                  aria-label={t("finance.assistant.askButton")}
                >
                  {questionStatus === "loading"
                    ? <Loader2 size={16} className="finance-assistant__ask-spinner" />
                    : <Send size={16} />}
                </button>
              </div>
            </label>
          </div>

          {!aiSettings.enabled ? (
            <p className="finance-assistant__message">
              {t("finance.assistant.aiDisabled")}
            </p>
          ) : null}

          {aiSettings.enabled && !canUseAi ? (
            <p className="finance-assistant__message">
              {t("finance.assistant.aiIncomplete")}
            </p>
          ) : null}

          {questionStatus === "error" && questionMessage ? (
            <p className="auth-form__error">{questionMessage}</p>
          ) : null}

          {questionAnswer ? (
            <div className="finance-assistant__answer">
              <div className="finance-assistant__answer-header">
                <Sparkles size={16} />
                <strong>{t("finance.assistant.answerTitle")}</strong>
              </div>
              <p>{questionAnswer}</p>
            </div>
          ) : null}
        </div>
      </Card>

      {/* ── Modals ───────────────────────────────────────────────────────── */}

      {/* Task from deterministic insight */}
      <TaskModal
        initialValues={
          taskDraft
            ? {
                description: taskDraft.description,
                priority: "medium",
                title: taskDraft.title,
              }
            : undefined
        }
        isOpen={taskDraft !== null}
        mode="create"
        onClose={() => setTaskDraft(null)}
      />

      {/* Task / Habit / Budget from AI action */}
      <FinanceActionConfirmModal
        action={pendingAction}
        categories={categories}
        currency={currency}
        isOpen={pendingAction !== null}
        onClose={handleClosePendingAction}
        onUpdateCategory={onUpdateCategory}
      />
    </div>
  );
}

function buildTaskDescription(insight: FinancialAssistantInsight): string {
  return `${insight.description}\n\n${insight.suggestedAction}`;
}
