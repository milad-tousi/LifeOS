import { FormEvent, useEffect, useMemo, useState } from "react";
import { Mic, MicOff, PencilLine, Trash2, Volume2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { useVoiceInput } from "@/features/finance/hooks/useVoiceInput";
import {
  FinanceCategory,
  FinanceMerchantRule,
  VoiceAlias,
} from "@/features/finance/types/finance.types";
import { getFinanceCategoryDisplayName, getVoiceAliasTargetDisplayName } from "@/features/finance/utils/finance.i18n";
import { formatAppDate } from "@/i18n/formatters";
import { useI18n } from "@/i18n";
import { createId } from "@/lib/id";

interface VoiceAliasesSectionProps {
  categories: FinanceCategory[];
  merchantRules: FinanceMerchantRule[];
  onAddVoiceAlias: (voiceAlias: VoiceAlias) => void;
  onDeleteVoiceAlias: (voiceAliasId: string) => void;
  onUpdateVoiceAlias: (voiceAlias: VoiceAlias) => void;
  voiceAliases: VoiceAlias[];
}

interface VoiceAliasFormState {
  categoryId: string;
  correctedText: string;
  heardText: string;
  targetType: VoiceAlias["targetType"];
}

const DEFAULT_FORM_STATE: VoiceAliasFormState = {
  categoryId: "",
  correctedText: "",
  heardText: "",
  targetType: "merchant",
};

export function VoiceAliasesSection({
  categories,
  merchantRules,
  onAddVoiceAlias,
  onDeleteVoiceAlias,
  onUpdateVoiceAlias,
  voiceAliases,
}: VoiceAliasesSectionProps): JSX.Element {
  const { language, t } = useI18n();
  const [editingAliasId, setEditingAliasId] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState<VoiceAliasFormState>(DEFAULT_FORM_STATE);
  const [manualError, setManualError] = useState("");
  const [trainingCorrectText, setTrainingCorrectText] = useState("");
  const [trainingError, setTrainingError] = useState("");
  const {
    error: voiceError,
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
  } = useVoiceInput();

  const editingAlias = useMemo(
    () => voiceAliases.find((voiceAlias) => voiceAlias.id === editingAliasId) ?? null,
    [editingAliasId, voiceAliases],
  );

  useEffect(() => {
    if (!transcript.trim()) {
      return;
    }

    setTrainingError("");
  }, [transcript]);

  function resetManualForm(): void {
    setEditingAliasId(null);
    setManualForm(DEFAULT_FORM_STATE);
    setManualError("");
  }

  function handleSubmitManualAlias(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const heardText = manualForm.heardText.trim();
    const correctedText = manualForm.correctedText.trim();

    if (!heardText) {
      setManualError(t("finance.voiceAliases.heardRequired"));
      return;
    }

    if (!correctedText) {
      setManualError(t("finance.voiceAliases.correctedRequired"));
      return;
    }

    if (manualForm.targetType === "category" && !manualForm.categoryId) {
      setManualError(t("finance.voiceAliases.categoryRequired"));
      return;
    }

    const hasDuplicate = voiceAliases.some(
      (voiceAlias) =>
        voiceAlias.id !== editingAliasId &&
        voiceAlias.heardText.trim().toLowerCase() === heardText.toLowerCase(),
    );

    if (hasDuplicate) {
      setManualError(t("finance.voiceAliases.duplicateHeard"));
      return;
    }

    const nextAlias: VoiceAlias = {
      id: editingAliasId ?? createId(),
      heardText,
      correctedText,
      targetType: manualForm.targetType,
      categoryId: manualForm.targetType === "category" ? manualForm.categoryId : undefined,
      merchantRuleId:
        manualForm.targetType === "merchant"
          ? merchantRules.find(
              (merchantRule) =>
                merchantRule.name.trim().toLowerCase() === correctedText.toLowerCase(),
            )?.id
          : undefined,
      createdAt: editingAlias?.createdAt ?? new Date().toISOString(),
      updatedAt: editingAliasId ? new Date().toISOString() : undefined,
    };

    if (editingAliasId) {
      onUpdateVoiceAlias(nextAlias);
    } else {
      onAddVoiceAlias(nextAlias);
    }

    resetManualForm();
  }

  function handleSaveTrainingAlias(): void {
    const correctedText = trainingCorrectText.trim();
    const heardText = transcript.trim();

    if (!correctedText) {
      setTrainingError(t("finance.voiceAliases.correctTextRequired"));
      return;
    }

    if (!heardText) {
      setTrainingError(t("finance.voiceAliases.recordTranscriptFirst"));
      return;
    }

    const hasDuplicate = voiceAliases.some(
      (voiceAlias) => voiceAlias.heardText.trim().toLowerCase() === heardText.toLowerCase(),
    );

    if (hasDuplicate) {
      setTrainingError(t("finance.voiceAliases.duplicateHeard"));
      return;
    }

    onAddVoiceAlias({
      id: createId(),
      heardText,
      correctedText,
      targetType: "merchant",
      merchantRuleId:
        merchantRules.find(
          (merchantRule) =>
            merchantRule.name.trim().toLowerCase() === correctedText.toLowerCase(),
        )?.id,
      createdAt: new Date().toISOString(),
    });

    setTrainingCorrectText("");
    setTrainingError("");
  }

  function startEditingAlias(voiceAlias: VoiceAlias): void {
    setEditingAliasId(voiceAlias.id);
    setManualForm({
      categoryId: voiceAlias.categoryId ?? "",
      correctedText: voiceAlias.correctedText,
      heardText: voiceAlias.heardText,
      targetType: voiceAlias.targetType,
    });
    setManualError("");
  }

  function formatDate(dateValue: string): string {
    const safeDate = new Date(dateValue);

    if (Number.isNaN(safeDate.getTime())) {
      return dateValue;
    }

    return formatAppDate(safeDate, language);
  }

  return (
    <Card
      subtitle={t("finance.voiceAliases.subtitle")}
      title={t("finance.voiceAliases.title")}
    >
      <div className="finance-settings-section finance-voice-aliases-shell">
        <div className="finance-voice-alias-grid">
          <div className="finance-voice-alias-panel">
            <div className="finance-voice-alias-panel__header">
              <strong>{t("finance.voiceAliases.manualTitle")}</strong>
              <p>{t("finance.voiceAliases.manualSubtitle")}</p>
            </div>

            <form
              className="finance-settings-form finance-settings-form--voice-alias"
              onSubmit={handleSubmitManualAlias}
            >
              <label className="auth-form__field finance-voice-alias-panel__field">
                <span className="auth-form__label">{t("finance.voiceAliases.heard")}</span>
                <input
                  className="auth-form__input"
                  onChange={(event) =>
                    setManualForm((current) => ({ ...current, heardText: event.target.value }))
                  }
                  placeholder={t("finance.voiceAliases.heardPlaceholder")}
                  value={manualForm.heardText}
                />
              </label>

              <label className="auth-form__field finance-voice-alias-panel__field">
                <span className="auth-form__label">{t("finance.voiceAliases.corrected")}</span>
                <input
                  className="auth-form__input"
                  onChange={(event) =>
                    setManualForm((current) => ({
                      ...current,
                      correctedText: event.target.value,
                    }))
                  }
                  placeholder={t("finance.voiceAliases.correctedPlaceholder")}
                  value={manualForm.correctedText}
                />
              </label>

              <label className="auth-form__field finance-voice-alias-panel__field finance-voice-alias-panel__field--type">
                <span className="auth-form__label">{t("finance.voiceAliases.target")}</span>
                <select
                  className="auth-form__input"
                  onChange={(event) =>
                    setManualForm((current) => ({
                      ...current,
                      targetType: event.target.value as VoiceAlias["targetType"],
                      categoryId:
                        event.target.value === "category" ? current.categoryId : "",
                    }))
                  }
                  value={manualForm.targetType}
                >
                  <option value="merchant">{t("finance.voiceAliases.targetMerchant")}</option>
                  <option value="category">{t("finance.voiceAliases.targetCategory")}</option>
                  <option value="general">{t("finance.voiceAliases.targetGeneral")}</option>
                </select>
              </label>

              {manualForm.targetType === "category" ? (
                <label className="auth-form__field finance-voice-alias-panel__field finance-voice-alias-panel__field--category">
                  <span className="auth-form__label">{t("finance.form.category")}</span>
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      setManualForm((current) => ({
                        ...current,
                        categoryId: event.target.value,
                      }))
                    }
                    value={manualForm.categoryId}
                  >
                    <option value="">{t("finance.selectCategory")}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {getFinanceCategoryDisplayName(category, t)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="finance-settings-form__actions finance-voice-alias-panel__actions">
                <div className="finance-voice-alias-panel__feedback">
                  {manualError ? <p className="auth-form__error">{manualError}</p> : null}
                </div>
                <div className="finance-settings-inline-actions">
                  {editingAliasId ? (
                    <Button onClick={resetManualForm} type="button" variant="secondary">
                      {t("common.cancel")}
                    </Button>
                  ) : null}
                  <Button type="submit">
                    {editingAliasId ? t("finance.voiceAliases.saveAlias") : t("finance.voiceAliases.addAlias")}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <div className="finance-voice-training-card">
            <div className="finance-voice-training-card__header">
              <span className="finance-empty-inline__icon">
                <Volume2 size={16} />
              </span>
              <div>
                <strong>{t("finance.voiceAliases.trainingTitle")}</strong>
                <p>{t("finance.voiceAliases.trainingSubtitle")}</p>
              </div>
            </div>

            <label className="auth-form__field">
              <span className="auth-form__label">{t("finance.voiceAliases.correctText")}</span>
              <input
                className="auth-form__input"
                onChange={(event) => setTrainingCorrectText(event.target.value)}
                placeholder={t("finance.voiceAliases.trainingPlaceholder")}
                value={trainingCorrectText}
              />
            </label>

            <div className="finance-voice-training-card__actions">
              <Button
                disabled={!isSupported && !isListening}
                onClick={() => {
                  if (isListening) {
                    stopListening();
                    return;
                  }

                  startListening();
                }}
                type="button"
                variant={isListening ? "secondary" : "primary"}
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                {isListening ? t("finance.voiceAliases.stopRecording") : t("finance.voiceAliases.record")}
              </Button>
              <Button onClick={handleSaveTrainingAlias} type="button">
                {t("finance.voiceAliases.saveAlias")}
              </Button>
            </div>

            <div className="finance-voice-training-card__preview">
              <span className="finance-transaction-card__chip">
                {isListening ? t("finance.listening") : t("finance.voiceAliases.transcript")}
              </span>
              <p>{transcript.trim() || t("finance.voiceAliases.noTranscript")}</p>
            </div>

            {!isSupported ? (
              <p className="text-muted">
                {t("finance.voiceAliases.voiceNotSupported")}
              </p>
            ) : null}
            {voiceError ? <p className="auth-form__error">{voiceError}</p> : null}
            {trainingError ? <p className="auth-form__error">{trainingError}</p> : null}
          </div>
        </div>

        <div className="finance-voice-alias-list">
          {voiceAliases.length === 0 ? (
            <div className="finance-empty-inline finance-empty-inline--recurring">
              <span className="finance-empty-inline__icon">
                <Volume2 size={16} />
              </span>
              <strong>{t("finance.voiceAliases.emptyTitle")}</strong>
              <p>{t("finance.voiceAliases.emptySubtitle")}</p>
            </div>
          ) : (
            voiceAliases.map((voiceAlias) => {
              const category =
                voiceAlias.categoryId &&
                categories.find((candidateCategory) => candidateCategory.id === voiceAlias.categoryId);

              return (
                <article className="finance-recurring-card" key={voiceAlias.id}>
                  <div className="finance-recurring-card__main">
                    <div className="finance-recurring-card__header">
                      <div className="finance-recurring-card__title-group">
                        <strong>{voiceAlias.heardText}</strong>
                        <div className="finance-recurring-card__badges">
                          <span className="finance-transaction-card__chip">
                            {getVoiceAliasTargetDisplayName(voiceAlias.targetType, t)}
                          </span>
                          {category ? (
                            <span className="finance-transaction-card__chip finance-transaction-card__chip--category">
                              {getFinanceCategoryDisplayName(category, t)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <strong>{voiceAlias.correctedText}</strong>
                    </div>
                    <div className="finance-recurring-card__meta">
                      <span className="finance-transaction-card__chip">
                        {t("finance.voiceAliases.created")} {formatDate(voiceAlias.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="finance-settings-row-actions">
                    <button
                      className="finance-settings-row-action"
                      onClick={() => startEditingAlias(voiceAlias)}
                      type="button"
                    >
                      <PencilLine size={15} />
                    </button>
                    <button
                      className="finance-settings-row-action finance-settings-row-action--danger"
                      onClick={() => {
                        if (window.confirm(t("finance.voiceAliases.deleteConfirm"))) {
                          onDeleteVoiceAlias(voiceAlias.id);
                        }
                      }}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
