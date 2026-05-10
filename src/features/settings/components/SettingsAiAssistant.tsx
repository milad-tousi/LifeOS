import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";
import {
  AI_PROVIDER_OPTIONS,
  saveAiSettings,
  useAiSettings,
} from "@/features/ai/aiSettingsStore";
import { testConnection } from "@/features/ai/aiClient";
import { AiProvider, AiSettings } from "@/features/ai/types";
import { useI18n } from "@/i18n";

export function SettingsAiAssistant(): JSX.Element {
  const { loading, settings } = useAiSettings();
  const { t } = useI18n();
  const [formState, setFormState] = useState<AiSettings | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [persistError, setPersistError] = useState("");
  const [connectionMessage, setConnectionMessage] = useState("");

  useEffect(() => {
    if (!loading && formState === null) {
      setFormState(settings);
    }
  }, [formState, loading, settings]);

  if (loading || !formState) {
    return <div className="settings-ai__loading">{t("common.loading")}</div>;
  }

  const statusTone = isTesting
    ? "idle"
    : formState.lastTestStatus === "success"
      ? "success"
      : formState.lastTestStatus === "failed"
        ? "failed"
        : "idle";

  const statusLabel = isTesting
    ? t("settings.ai.testingConnection")
    : connectionMessage ||
      (formState.lastTestStatus === "success"
        ? t("settings.ai.status.success")
        : formState.lastTestStatus === "failed"
          ? t("settings.ai.status.failed")
          : t("settings.ai.status.idle"));

  function getProviderLabel(provider: AiProvider): string {
    return t(`settings.ai.providers.${provider}`);
  }

  function getBaseUrlPlaceholder(provider: AiProvider): string {
    if (provider === "ollama") {
      return "http://localhost:11434";
    }

    return "https://api.openai.com/v1";
  }

  function getModelPlaceholder(provider: AiProvider): string {
    if (provider === "ollama") {
      return "llama3.2";
    }

    return "gpt-4.1-mini";
  }

  function updateFormState(patch: Partial<AiSettings>): void {
    const shouldResetTestStatus =
      patch.provider !== undefined ||
      patch.baseUrl !== undefined ||
      patch.apiKey !== undefined ||
      patch.model !== undefined;

    const nextState: AiSettings = {
      ...formState,
      ...patch,
      lastTestStatus:
        patch.lastTestStatus !== undefined
          ? patch.lastTestStatus
          : shouldResetTestStatus
            ? null
            : formState.lastTestStatus,
    };

    setFormState(nextState);
    setPersistError("");

    if (shouldResetTestStatus) {
      setConnectionMessage("");
    }

    void saveAiSettings(nextState).catch(() => {
      setPersistError(t("common.saveFailed"));
    });
  }

  async function handleTestConnection(): Promise<void> {
    if (!formState.baseUrl.trim()) {
      setConnectionMessage(t("settings.ai.validation.baseUrlRequired"));
      updateFormState({ lastTestStatus: "failed" });
      return;
    }

    if (!formState.model.trim()) {
      setConnectionMessage(t("settings.ai.validation.modelRequired"));
      updateFormState({ lastTestStatus: "failed" });
      return;
    }

    setIsTesting(true);
    setConnectionMessage("");

    const result = await testConnection(formState);
    setIsTesting(false);

    if (result.status === "success") {
      updateFormState({ lastTestStatus: "success" });
      setConnectionMessage(t("settings.ai.status.success"));
      return;
    }

    updateFormState({ lastTestStatus: "failed" });
    setConnectionMessage(
      t("settings.ai.status.failedWithReason", {
        reason: result.error ?? t("settings.ai.status.failed"),
      }),
    );
  }

  return (
    <div className="settings-ai">
      <div className="settings-ai__toggle-row">
        <div className="settings-ai__toggle-copy">
          <div className="settings-action-row__icon-wrap">
            <Sparkles size={20} strokeWidth={1.9} />
          </div>
          <div className="settings-action-row__content">
            <span className="settings-action-row__title">{t("settings.ai.enable")}</span>
            <span className="settings-action-row__subtitle">{t("settings.ai.enableDescription")}</span>
          </div>
        </div>
        <label className="finance-toggle" htmlFor="settings-ai-enabled">
          <input
            checked={formState.enabled}
            id="settings-ai-enabled"
            onChange={(event) => updateFormState({ enabled: event.target.checked })}
            type="checkbox"
          />
          <span
            aria-hidden="true"
            className={`finance-toggle__track${formState.enabled ? " finance-toggle__track--active" : ""}`}
          >
            <span className="finance-toggle__thumb" />
          </span>
        </label>
      </div>

      <div className="settings-ai__grid">
        <label className="auth-form__field">
          <span className="auth-form__label">{t("settings.ai.provider")}</span>
          <select
            className="auth-form__input"
            onChange={(event) => updateFormState({ provider: event.target.value as AiProvider })}
            value={formState.provider}
          >
            {AI_PROVIDER_OPTIONS.map((provider) => (
              <option key={provider} value={provider}>
                {getProviderLabel(provider)}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-form__field">
          <span className="auth-form__label">{t("settings.ai.model")}</span>
          <input
            className="auth-form__input"
            onChange={(event) => updateFormState({ model: event.target.value })}
            placeholder={getModelPlaceholder(formState.provider)}
            value={formState.model}
          />
        </label>

        <label className="auth-form__field settings-ai__field--full">
          <span className="auth-form__label">{t("settings.ai.baseUrl")}</span>
          <input
            className="auth-form__input"
            onChange={(event) => updateFormState({ baseUrl: event.target.value })}
            placeholder={getBaseUrlPlaceholder(formState.provider)}
            value={formState.baseUrl}
          />
          <span className="settings-ai__hint">
            {formState.provider === "ollama"
              ? t("settings.ai.providerHint.ollama")
              : t("settings.ai.providerHint.openaiCompatible")}
          </span>
        </label>

        <label className="auth-form__field settings-ai__field--full">
          <span className="auth-form__label">{t("settings.ai.apiKey")}</span>
          <input
            className="auth-form__input"
            onChange={(event) => updateFormState({ apiKey: event.target.value })}
            placeholder={t("settings.ai.apiKeyPlaceholder")}
            type="password"
            value={formState.apiKey ?? ""}
          />
        </label>
      </div>

      <p className="settings-ai__warning">{t("settings.ai.localApiKeyWarning")}</p>
      {persistError ? <p className="auth-form__error">{persistError}</p> : null}

      <div className="settings-ai__footer">
        <span
          aria-live="polite"
          className={`settings-ai__status settings-ai__status--${statusTone}`}
        >
          {statusLabel}
        </span>
        <Button disabled={isTesting} onClick={() => void handleTestConnection()} type="button">
          {isTesting ? t("settings.ai.testingConnection") : t("settings.ai.testConnection")}
        </Button>
      </div>
    </div>
  );
}
