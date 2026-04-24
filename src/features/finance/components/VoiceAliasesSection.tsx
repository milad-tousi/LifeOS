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
      setManualError("Heard text is required.");
      return;
    }

    if (!correctedText) {
      setManualError("Corrected text is required.");
      return;
    }

    if (manualForm.targetType === "category" && !manualForm.categoryId) {
      setManualError("Choose a category for category aliases.");
      return;
    }

    const hasDuplicate = voiceAliases.some(
      (voiceAlias) =>
        voiceAlias.id !== editingAliasId &&
        voiceAlias.heardText.trim().toLowerCase() === heardText.toLowerCase(),
    );

    if (hasDuplicate) {
      setManualError("Duplicate heard text is not allowed.");
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
      setTrainingError("Correct text is required.");
      return;
    }

    if (!heardText) {
      setTrainingError("Record a transcript before saving.");
      return;
    }

    const hasDuplicate = voiceAliases.some(
      (voiceAlias) => voiceAlias.heardText.trim().toLowerCase() === heardText.toLowerCase(),
    );

    if (hasDuplicate) {
      setTrainingError("Duplicate heard text is not allowed.");
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

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(safeDate);
  }

  return (
    <Card
      subtitle="Teach LifeOS how to correct speech recognition mistakes for merchants, categories, and common words."
      title="Voice Aliases"
    >
      <div className="finance-settings-section finance-voice-aliases-shell">
        <div className="finance-voice-alias-grid">
          <div className="finance-voice-alias-panel">
            <div className="finance-voice-alias-panel__header">
              <strong>Manual Alias</strong>
              <p>Add a correction directly for text the browser often mishears.</p>
            </div>

            <form
              className="finance-settings-form finance-settings-form--voice-alias"
              onSubmit={handleSubmitManualAlias}
            >
              <label className="auth-form__field finance-voice-alias-panel__field">
                <span className="auth-form__label">Heard</span>
                <input
                  className="auth-form__input"
                  onChange={(event) =>
                    setManualForm((current) => ({ ...current, heardText: event.target.value }))
                  }
                  placeholder="vomer"
                  value={manualForm.heardText}
                />
              </label>

              <label className="auth-form__field finance-voice-alias-panel__field">
                <span className="auth-form__label">Corrected</span>
                <input
                  className="auth-form__input"
                  onChange={(event) =>
                    setManualForm((current) => ({
                      ...current,
                      correctedText: event.target.value,
                    }))
                  }
                  placeholder="Vomar"
                  value={manualForm.correctedText}
                />
              </label>

              <label className="auth-form__field finance-voice-alias-panel__field finance-voice-alias-panel__field--type">
                <span className="auth-form__label">Target</span>
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
                  <option value="merchant">Merchant</option>
                  <option value="category">Category</option>
                  <option value="general">General</option>
                </select>
              </label>

              {manualForm.targetType === "category" ? (
                <label className="auth-form__field finance-voice-alias-panel__field finance-voice-alias-panel__field--category">
                  <span className="auth-form__label">Category</span>
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
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
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
                      Cancel
                    </Button>
                  ) : null}
                  <Button type="submit">
                    {editingAliasId ? "Save Alias" : "Add Alias"}
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
                <strong>Voice Training</strong>
                <p>Record a common misheard phrase and save its corrected version.</p>
              </div>
            </div>

            <label className="auth-form__field">
              <span className="auth-form__label">Correct text</span>
              <input
                className="auth-form__input"
                onChange={(event) => setTrainingCorrectText(event.target.value)}
                placeholder="Vomar, Albert Heijn, NS..."
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
                {isListening ? "Stop Recording" : "Record"}
              </Button>
              <Button onClick={handleSaveTrainingAlias} type="button">
                Save Alias
              </Button>
            </div>

            <div className="finance-voice-training-card__preview">
              <span className="finance-transaction-card__chip">
                {isListening ? "Listening..." : "Transcript"}
              </span>
              <p>{transcript.trim() || "No transcript captured yet."}</p>
            </div>

            {!isSupported ? (
              <p className="text-muted">
                Voice recording is not supported in this browser. You can still add aliases
                manually.
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
              <strong>No voice aliases yet</strong>
              <p>Add your first correction to improve Quick Capture accuracy.</p>
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
                            {voiceAlias.targetType}
                          </span>
                          {category ? (
                            <span className="finance-transaction-card__chip finance-transaction-card__chip--category">
                              {category.name}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <strong>{voiceAlias.correctedText}</strong>
                    </div>
                    <div className="finance-recurring-card__meta">
                      <span className="finance-transaction-card__chip">
                        Created {formatDate(voiceAlias.createdAt)}
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
                        if (window.confirm("Are you sure you want to delete this voice alias?")) {
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
