import { BrainCircuit, BrainCog, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { AiFinanceStatus } from "@/features/finance/types/financialAssistant";
import { useI18n } from "@/i18n";

interface AiFinanceStatusCardProps {
  aiEnabled: boolean;
  aiConfigured: boolean;
  status: AiFinanceStatus;
  errorMessage: string;
  onAnalyze: () => void;
  onOpenSettings: () => void;
}

export function AiFinanceStatusCard({
  aiEnabled,
  aiConfigured,
  status,
  errorMessage,
  onAnalyze,
  onOpenSettings,
}: AiFinanceStatusCardProps): JSX.Element {
  const { t } = useI18n();
  const isLoading = status === "loading";

  return (
    <Card
      title={t("finance.assistant.ai.cardTitle")}
      subtitle={t("finance.assistant.ai.cardSubtitle")}
    >
      <div className="finance-assistant__ai-status">
        {!aiEnabled ? (
          <div className="finance-assistant__ai-badge finance-assistant__ai-badge--off">
            <BrainCog size={16} />
            <span>{t("finance.assistant.ai.statusOff")}</span>
          </div>
        ) : (
          <div className="finance-assistant__ai-badge finance-assistant__ai-badge--on">
            <BrainCircuit size={16} />
            <span>{t("finance.assistant.ai.statusOn")}</span>
          </div>
        )}

        {aiEnabled && !aiConfigured ? (
          <p className="finance-assistant__message">
            {t("finance.assistant.aiIncomplete")}
            {" "}
            <button
              className="finance-assistant__inline-link"
              onClick={onOpenSettings}
              type="button"
            >
              {t("finance.assistant.ai.openSettings")}
            </button>
          </p>
        ) : null}

        {aiEnabled && aiConfigured ? (
          <div className="finance-assistant__ai-actions">
            <Button
              disabled={isLoading}
              onClick={onAnalyze}
              type="button"
              variant={status === "success" ? "secondary" : "primary"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="finance-assistant__spin" size={15} />
                  {t("finance.assistant.ai.analyzing")}
                </>
              ) : (
                t("finance.assistant.ai.analyzeButton")
              )}
            </Button>
            {status === "success" ? (
              <span className="finance-assistant__ai-success-label">
                {t("finance.assistant.ai.analysisReady")}
              </span>
            ) : null}
          </div>
        ) : null}

        {status === "error" && errorMessage ? (
          <p className="auth-form__error">{errorMessage}</p>
        ) : null}

        <div className="finance-assistant__ai-privacy">
          <ShieldCheck size={13} />
          <span>{t("finance.assistant.ai.privacyNote")}</span>
        </div>
      </div>
    </Card>
  );
}
