import { useState } from "react";
import { ScanLine } from "lucide-react";
import { useAiSettings } from "@/features/ai/aiSettingsStore";
import { ReceiptScanModal } from "@/features/finance/components/ReceiptScanModal";
import { useI18n } from "@/i18n";

export function ReceiptScanButton(): JSX.Element {
  const { t } = useI18n();
  const { settings } = useAiSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isConfigured =
    settings.enabled &&
    settings.baseUrl.trim() !== "" &&
    settings.model.trim() !== "";

  const tooltip = isConfigured
    ? t("finance.receipt.buttonTooltipActive")
    : t("finance.receipt.buttonTooltipDisabled");

  return (
    <>
      <button
        aria-label={tooltip}
        className={`icon-button receipt-scan-btn${!isConfigured ? " receipt-scan-btn--disabled" : ""}`}
        disabled={!isConfigured}
        onClick={() => setIsModalOpen(true)}
        title={tooltip}
        type="button"
      >
        <ScanLine size={18} />
      </button>

      <ReceiptScanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
