import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Mic, MicOff } from "lucide-react";
import { Card } from "@/components/common/Card";
import { TransactionForm, TransactionFormValue } from "@/features/finance/components/TransactionForm";
import { useVoiceInput } from "@/features/finance/hooks/useVoiceInput";
import {
  FinanceCategory,
  FinanceMerchantRule,
  FinanceTransaction,
  SmartRule,
  VoiceAlias,
} from "@/features/finance/types/finance.types";
import {
  VoiceNormalizationCorrection,
  normalizeVoiceCaptureInput,
} from "@/features/finance/utils/finance.voiceNormalize";
import { createId } from "@/lib/id";

interface FinanceQuickAddFormProps {
  categories: FinanceCategory[];
  merchantRules: FinanceMerchantRule[];
  onAddTransaction: (transaction: FinanceTransaction) => void;
  smartRules: SmartRule[];
  voiceAliases: VoiceAlias[];
}

const QUICK_CAPTURE_AMOUNT_PATTERN =
  /(?:\u20AC|\$|\u00A3)?\s*\d+(?:[.,]\d{1,2})?\s*(?:\u20AC|\$|\u00A3|eur|euro|usd|dollar|gbp|pound|irr|rial)?/i;

export function FinanceQuickAddForm({
  categories,
  merchantRules,
  onAddTransaction,
  smartRules,
  voiceAliases,
}: FinanceQuickAddFormProps): JSX.Element {
  const [quickCaptureInput, setQuickCaptureInput] = useState("");
  const [quickCaptureCorrections, setQuickCaptureCorrections] = useState<
    VoiceNormalizationCorrection[]
  >([]);
  const [prefillValue, setPrefillValue] = useState<Partial<TransactionFormValue> | undefined>(
    undefined,
  );
  const [prefillVersion, setPrefillVersion] = useState(0);
  const {
    error: voiceError,
    isListening,
    isProcessing,
    isSupported,
    startListening,
    stopListening,
    transcript,
  } = useVoiceInput();

  const quickCaptureHint = useMemo(() => {
    if (isListening) {
      return "Listening...";
    }

    if (isProcessing) {
      return "Processing voice input...";
    }

    return "Say something like 'Vomar 30 euro'";
  }, [isListening, isProcessing]);

  useEffect(() => {
    if (!transcript.trim()) {
      return;
    }

    applyQuickCaptureInput(transcript);
  }, [transcript]);

  function handleSubmit(value: TransactionFormValue): void {
    onAddTransaction({
      id: createId(),
      createdAt: new Date().toISOString(),
      ...value,
    });
  }

  function applyQuickCaptureInput(value: string): void {
    const normalizedResult = normalizeVoiceCaptureInput(value, merchantRules, voiceAliases);
    const nextInput = normalizedResult.normalizedText || value;
    const parsedDraft = parseQuickCaptureInput(nextInput);

    setQuickCaptureInput(nextInput);
    setQuickCaptureCorrections(normalizedResult.corrections);
    setPrefillValue(parsedDraft);
    setPrefillVersion((current) => current + 1);
  }

  return (
    <Card
      subtitle="Use quick capture, typing, or voice to prefill the transaction form before saving."
      title="Quick Add Transaction"
    >
      <div className="finance-form-shell">
        <div className="finance-quick-capture">
          <label className="auth-form__field finance-quick-capture__field">
            <span className="auth-form__label">Quick Capture</span>
            <div className="finance-quick-capture__input-wrap">
              <input
                className="auth-form__input finance-quick-capture__input"
                onChange={(event) => {
                  applyQuickCaptureInput(event.target.value);
                }}
                placeholder="Say something like 'Vomar 30 euro'"
                value={quickCaptureInput}
              />
              <button
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                className={`icon-button finance-quick-capture__mic${
                  isListening ? " finance-quick-capture__mic--listening" : ""
                }`}
                disabled={!isSupported && !isListening}
                onClick={() => {
                  if (isListening) {
                    stopListening();
                    return;
                  }

                  startListening();
                }}
                title={
                  isSupported
                    ? isListening
                      ? "Stop listening"
                      : "Start voice input"
                    : "Voice input is not supported in this browser."
                }
                type="button"
              >
                {isProcessing && !isListening ? (
                  <LoaderCircle className="finance-quick-capture__spinner" size={16} />
                ) : isListening ? (
                  <MicOff size={16} />
                ) : (
                  <Mic size={16} />
                )}
              </button>
            </div>
          </label>

          <div className="finance-quick-capture__status">
            <span
              className={`finance-quick-capture__status-chip${
                isListening ? " finance-quick-capture__status-chip--live" : ""
              }`}
            >
              {quickCaptureHint}
            </span>
            {quickCaptureCorrections.length > 0 ? (
              <p className="finance-quick-capture__correction">
                {quickCaptureCorrections
                  .map(
                    (correction) =>
                      correction.reason === "user-alias"
                        ? `Applied voice alias: '${correction.original}' -> '${correction.corrected}'`
                        : `Corrected '${correction.original}' to '${correction.corrected}'`,
                  )
                  .join(" | ")}
              </p>
            ) : null}
            {voiceError ? <p className="auth-form__error">{voiceError}</p> : null}
          </div>
        </div>

        <TransactionForm
          categories={categories}
          merchantRules={merchantRules}
          mode="create"
          onSubmit={handleSubmit}
          prefillValue={prefillValue}
          prefillVersion={prefillVersion}
          smartRules={smartRules}
        />
      </div>
    </Card>
  );
}

function parseQuickCaptureInput(input: string): Partial<TransactionFormValue> {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    return {};
  }

  const amountSegmentMatch = normalizedInput.match(QUICK_CAPTURE_AMOUNT_PATTERN);
  const amountValueMatch = amountSegmentMatch?.[0].match(/\d+(?:[.,]\d{1,2})?/);
  const amount = amountValueMatch ? Number(amountValueMatch[0].replace(",", ".")) : undefined;

  if (!amountSegmentMatch || amountSegmentMatch.index === undefined) {
    return {
      merchant: cleanQuickCaptureText(normalizedInput),
      note: "",
    };
  }

  const merchantPart = cleanQuickCaptureText(
    normalizedInput.slice(0, amountSegmentMatch.index),
  );
  const notePart = cleanQuickCaptureText(
    normalizedInput.slice(amountSegmentMatch.index + amountSegmentMatch[0].length),
  );

  return {
    amount: Number.isFinite(amount) ? amount : undefined,
    merchant: merchantPart || cleanQuickCaptureText(normalizedInput),
    note: notePart || "",
  };
}

function cleanQuickCaptureText(value: string): string {
  return value
    .replace(/[\u20AC$\u00A3]/g, " ")
    .replace(/\b(eur|euro|usd|dollar|gbp|pound|irr|rial)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
