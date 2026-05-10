import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Camera, FileImage, ShieldCheck, UploadCloud, Zap } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ModalShell } from "@/components/common/ModalShell";
import { getAiSettings } from "@/features/ai/aiSettingsStore";
import { isVisionCapable } from "@/features/ai/types";
import { MatchedReceiptData } from "@/features/finance/ai/parseReceiptScanResult";
import { scanReceiptWithAi, VisionNotSupportedError } from "@/features/finance/ai/scanReceiptWithAi";
import { financeStorage } from "@/features/finance/services/finance.storage";
import { emitFinanceTransactionAdded } from "@/features/finance/services/financeEvents";
import { FinanceCategory } from "@/features/finance/types/finance.types";
import { createId } from "@/lib/id";
import { useI18n } from "@/i18n";

// TODO: Add persistent local attachment storage for receipt images in a future iteration.

type ScanStep = "upload" | "analyzing" | "confirm" | "error";

interface ConfirmFormState {
  merchant: string;
  date: string;
  amount: string;
  currency: string;
  categoryId: string;
  description: string;
}

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type SupportedMimeType = (typeof SUPPORTED_TYPES)[number];

function isSupportedMimeType(value: string): value is SupportedMimeType {
  return (SUPPORTED_TYPES as readonly string[]).includes(value);
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "receipt-scan__confidence--high";
  if (confidence >= 0.5) return "receipt-scan__confidence--medium";
  return "receipt-scan__confidence--low";
}

export function ReceiptScanModal({ isOpen, onClose }: ReceiptScanModalProps): JSX.Element | null {
  const { language, t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<ScanStep>("upload");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageMimeType, setImageMimeType] = useState<SupportedMimeType>("image/jpeg");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [visionNotSupported, setVisionNotSupported] = useState(false);
  const [scannedData, setScannedData] = useState<MatchedReceiptData | null>(null);
  const [formState, setFormState] = useState<ConfirmFormState>({
    merchant: "",
    date: "",
    amount: "",
    currency: "EUR",
    categoryId: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<ConfirmFormState>>({});
  const [saving, setSaving] = useState(false);

  // Lazy-load categories and settings from storage when needed
  function getCategories(): FinanceCategory[] {
    return financeStorage.getCategories().filter((c) => c.type !== "income");
  }

  function resetModal(): void {
    setStep("upload");
    setImagePreviewUrl(null);
    setImageBase64("");
    setImageMimeType("image/jpeg");
    setErrorMessage("");
    setVisionNotSupported(false);
    setScannedData(null);
    setFormState({ merchant: "", date: "", amount: "", currency: "EUR", categoryId: "", description: "" });
    setFormErrors({});
    setSaving(false);
  }

  function handleClose(): void {
    resetModal();
    onClose();
  }

  function readFileAsBase64(file: File): Promise<{ base64: string; mimeType: SupportedMimeType }> {
    return new Promise((resolve, reject) => {
      if (!isSupportedMimeType(file.type)) {
        reject(new Error("Unsupported file type. Please use JPEG, PNG, WebP, or GIF."));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // result is data:image/jpeg;base64,XXXXX — strip prefix
        const base64 = result.split(",")[1] ?? "";
        resolve({ base64, mimeType: file.type as SupportedMimeType });
      };
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
  }

  async function loadImageFile(file: File): Promise<void> {
    try {
      const { base64, mimeType } = await readFileAsBase64(file);
      setImageBase64(base64);
      setImageMimeType(mimeType);
      setImagePreviewUrl(URL.createObjectURL(file));
      setStep("upload"); // stay on upload to show preview + analyze button
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t("finance.receipt.errorGeneric"));
      setStep("error");
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) void loadImageFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  async function handleAnalyze(): Promise<void> {
    if (!imageBase64) return;

    setStep("analyzing");
    setErrorMessage("");
    setVisionNotSupported(false);

    try {
      const settings = await getAiSettings();

      // Check vision capability before sending
      if (!isVisionCapable(settings)) {
        setVisionNotSupported(true);
        setStep("error");
        return;
      }

      const categories = getCategories();
      const finSettings = financeStorage.getFinanceSettings();

      const result = await scanReceiptWithAi(settings, {
        imageBase64,
        mimeType: imageMimeType,
        categories,
        currency: finSettings.currency,
        appLanguage: language,
      });

      setScannedData(result);
      setFormState({
        merchant: result.merchant ?? "",
        date: result.date ?? new Date().toISOString().split("T")[0],
        amount: result.totalAmount > 0 ? String(result.totalAmount) : "",
        currency: result.currency ?? finSettings.currency,
        categoryId: result.categoryId ?? "",
        description: result.description ?? "",
      });
      setStep("confirm");
    } catch (err) {
      if (err instanceof VisionNotSupportedError) {
        setVisionNotSupported(true);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : t("finance.receipt.errorScan"),
        );
      }
      setStep("error");
    }
  }

  function patchForm(field: keyof ConfirmFormState, value: string): void {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateForm(): boolean {
    const errors: Partial<ConfirmFormState> = {};
    if (!formState.merchant.trim()) errors.merchant = t("finance.receipt.errorMerchantRequired");
    if (!formState.date) errors.date = t("finance.receipt.errorDateRequired");
    const amount = Number(formState.amount);
    if (!Number.isFinite(amount) || amount <= 0) errors.amount = t("finance.receipt.errorAmountRequired");
    if (!formState.categoryId) errors.categoryId = t("finance.receipt.errorCategoryRequired");
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleCreateExpense(e: FormEvent): void {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const newTransaction = {
        id: createId(),
        type: "expense" as const,
        amount: Math.round(Number(formState.amount) * 100) / 100,
        categoryId: formState.categoryId,
        merchant: formState.merchant.trim(),
        note: formState.description.trim() || undefined,
        date: formState.date,
        createdAt: now,
        updatedAt: now,
      };

      const existing = financeStorage.getTransactions();
      financeStorage.saveTransactions([newTransaction, ...existing]);
      emitFinanceTransactionAdded();
      handleClose();
    } catch {
      setErrorMessage(t("finance.receipt.errorSave"));
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const categories = getCategories();

  return (
    <ModalShell
      isOpen={isOpen}
      onRequestClose={handleClose}
      title={t("finance.receipt.modalTitle")}
      description={t("finance.receipt.modalSubtitle")}
      size="wide"
    >
      <div className="receipt-scan">

        {/* ── Upload / Preview step ─────────────────────────────────────── */}
        {(step === "upload" || step === "analyzing") && (
          <div className="receipt-scan__upload-area">
            {imagePreviewUrl ? (
              <div className="receipt-scan__preview">
                <img
                  alt={t("finance.receipt.previewAlt")}
                  className="receipt-scan__preview-img"
                  src={imagePreviewUrl}
                />
                <Button
                  onClick={() => {
                    setImagePreviewUrl(null);
                    setImageBase64("");
                  }}
                  type="button"
                  variant="ghost"
                >
                  {t("finance.receipt.changeImage")}
                </Button>
              </div>
            ) : (
              <div className="receipt-scan__dropzone">
                <FileImage className="receipt-scan__dropzone-icon" size={40} />
                <p>{t("finance.receipt.uploadPrompt")}</p>
                <div className="receipt-scan__upload-buttons">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    variant="secondary"
                  >
                    <UploadCloud size={15} />
                    {t("finance.receipt.uploadButton")}
                  </Button>
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    type="button"
                    variant="ghost"
                  >
                    <Camera size={15} />
                    {t("finance.receipt.cameraButton")}
                  </Button>
                </div>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="receipt-scan__file-input"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
            <input
              accept="image/*"
              capture="environment"
              className="receipt-scan__file-input"
              onChange={handleFileChange}
              ref={cameraInputRef}
              type="file"
            />

            {imageBase64 && step !== "analyzing" && (
              <div className="receipt-scan__analyze-row">
                <Button
                  onClick={() => { void handleAnalyze(); }}
                  type="button"
                >
                  <Zap size={15} />
                  {t("finance.receipt.analyzeButton")}
                </Button>
              </div>
            )}

            {step === "analyzing" && (
              <div className="receipt-scan__loading">
                <span className="receipt-scan__spinner" />
                <span>{t("finance.receipt.analyzing")}</span>
              </div>
            )}

            <div className="receipt-scan__privacy">
              <ShieldCheck size={13} />
              <span>{t("finance.receipt.privacyNote")}</span>
            </div>
          </div>
        )}

        {/* ── Error step ────────────────────────────────────────────────── */}
        {step === "error" && (
          <div className="receipt-scan__error-state">
            {visionNotSupported ? (
              <>
                <p className="auth-form__error">
                  {t("finance.receipt.visionNotSupported")}
                </p>
              </>
            ) : (
              <p className="auth-form__error">
                {errorMessage || t("finance.receipt.errorScan")}
              </p>
            )}
            <Button
              onClick={() => setStep("upload")}
              type="button"
              variant="secondary"
            >
              {t("finance.receipt.tryAgain")}
            </Button>
          </div>
        )}

        {/* ── Confirm form step ─────────────────────────────────────────── */}
        {step === "confirm" && scannedData && (
          <form className="receipt-scan__confirm-form" onSubmit={handleCreateExpense}>

            <div className="receipt-scan__confirm-banner">
              <div className={`receipt-scan__confidence ${confidenceColor(scannedData.confidence)}`}>
                {t("finance.receipt.confidence")}{" "}
                {Math.round(scannedData.confidence * 100)}%
              </div>
              <p className="receipt-scan__confirm-hint">{t("finance.receipt.confirmHint")}</p>
            </div>

            {scannedData.warnings.length > 0 && (
              <div className="receipt-scan__warnings">
                {scannedData.warnings.map((w, i) => (
                  <p className="receipt-scan__warning-item" key={i}>⚠ {w}</p>
                ))}
              </div>
            )}

            <div className="receipt-scan__form-grid">
              {/* Merchant */}
              <div className="auth-form__field">
                <label className="auth-form__label" htmlFor="rs-merchant">
                  {t("finance.receipt.fieldMerchant")}
                </label>
                <input
                  className={`auth-form__input${formErrors.merchant ? " auth-form__input--error" : ""}`}
                  id="rs-merchant"
                  onChange={(e) => patchForm("merchant", e.target.value)}
                  type="text"
                  value={formState.merchant}
                />
                {formErrors.merchant && <span className="auth-form__error">{formErrors.merchant}</span>}
              </div>

              {/* Date */}
              <div className="auth-form__field">
                <label className="auth-form__label" htmlFor="rs-date">
                  {t("finance.receipt.fieldDate")}
                </label>
                <input
                  className={`auth-form__input${formErrors.date ? " auth-form__input--error" : ""}`}
                  id="rs-date"
                  onChange={(e) => patchForm("date", e.target.value)}
                  type="date"
                  value={formState.date}
                />
                {formErrors.date && <span className="auth-form__error">{formErrors.date}</span>}
              </div>

              {/* Amount */}
              <div className="auth-form__field">
                <label className="auth-form__label" htmlFor="rs-amount">
                  {t("finance.receipt.fieldAmount")}
                </label>
                <input
                  className={`auth-form__input${formErrors.amount ? " auth-form__input--error" : ""}`}
                  id="rs-amount"
                  min="0.01"
                  onChange={(e) => patchForm("amount", e.target.value)}
                  step="0.01"
                  type="number"
                  value={formState.amount}
                />
                {formErrors.amount && <span className="auth-form__error">{formErrors.amount}</span>}
              </div>

              {/* Currency */}
              <div className="auth-form__field">
                <label className="auth-form__label" htmlFor="rs-currency">
                  {t("finance.receipt.fieldCurrency")}
                </label>
                <select
                  className="auth-form__input"
                  id="rs-currency"
                  onChange={(e) => patchForm("currency", e.target.value)}
                  value={formState.currency}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="IRR">IRR</option>
                </select>
              </div>

              {/* Category */}
              <div className="auth-form__field">
                <label className="auth-form__label" htmlFor="rs-category">
                  {t("finance.receipt.fieldCategory")}
                </label>
                <select
                  className={`auth-form__input${formErrors.categoryId ? " auth-form__input--error" : ""}`}
                  id="rs-category"
                  onChange={(e) => patchForm("categoryId", e.target.value)}
                  value={formState.categoryId}
                >
                  <option value="">{t("finance.receipt.selectCategory")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {formErrors.categoryId && <span className="auth-form__error">{formErrors.categoryId}</span>}
              </div>

              {/* Description */}
              <div className="auth-form__field receipt-scan__field--full">
                <label className="auth-form__label" htmlFor="rs-desc">
                  {t("finance.receipt.fieldDescription")}
                </label>
                <input
                  className="auth-form__input"
                  id="rs-desc"
                  onChange={(e) => patchForm("description", e.target.value)}
                  type="text"
                  value={formState.description}
                />
              </div>
            </div>

            {/* Line items (display only) */}
            {scannedData.lineItems.length > 0 && (
              <details className="receipt-scan__line-items">
                <summary>{t("finance.receipt.lineItemsLabel")} ({scannedData.lineItems.length})</summary>
                <ul className="receipt-scan__line-items-list">
                  {scannedData.lineItems.map((item, i) => (
                    <li key={i}>
                      <span>{item.name}</span>
                      {item.quantity !== 1 && <span>×{item.quantity}</span>}
                      <span>{formState.currency} {item.amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="receipt-scan__confirm-footer">
              <Button disabled={saving} type="submit">
                {saving ? t("finance.receipt.saving") : t("finance.receipt.createExpense")}
              </Button>
              <Button onClick={handleClose} type="button" variant="ghost">
                {t("finance.receipt.cancel")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ModalShell>
  );
}
