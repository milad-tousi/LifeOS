import { useState } from "react";
import { ChevronRight, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface SettingsDangerZoneProps {
  isLoading?: boolean;
  onTerminate: () => Promise<void>;
}

export function SettingsDangerZone({
  isLoading = false,
  onTerminate,
}: SettingsDangerZoneProps): JSX.Element {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm(): Promise<void> {
    setIsConfirming(true);

    try {
      await onTerminate();
    } finally {
      setIsConfirming(false);
      setIsDialogOpen(false);
    }
  }

  return (
    <>
      <button
        className="settings-action-row settings-action-row--danger"
        disabled={isLoading}
        onClick={() => setIsDialogOpen(true)}
        type="button"
      >
        <div className="settings-action-row__icon-wrap settings-action-row__icon-wrap--danger">
          <Trash2 size={20} strokeWidth={1.9} />
        </div>

        <div className="settings-action-row__content">
          <span className="settings-action-row__title">Terminate account</span>
          <span className="settings-action-row__subtitle">
            Permanently remove this local account from this device
          </span>
        </div>

        <div className="settings-action-row__meta settings-action-row__meta--danger">
          <ChevronRight size={18} strokeWidth={1.9} />
        </div>
      </button>

      <ConfirmDialog
        confirmLabel="Terminate"
        description="This will permanently remove your local account and sign you out from this device."
        isConfirming={isConfirming}
        isOpen={isDialogOpen}
        onCancel={() => {
          if (!isConfirming) {
            setIsDialogOpen(false);
          }
        }}
        onConfirm={() => {
          void handleConfirm();
        }}
        title="Terminate account?"
        tone="danger"
      />
    </>
  );
}
