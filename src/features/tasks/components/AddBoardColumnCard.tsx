import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ModalShell } from "@/components/common/ModalShell";
import { useI18n } from "@/i18n";

interface AddBoardColumnCardProps {
  onAddColumn: (title: string) => Promise<void> | void;
}

export function AddBoardColumnCard({ onAddColumn }: AddBoardColumnCardProps): JSX.Element {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!value.trim()) {
      return;
    }

    await onAddColumn(value.trim());
    setValue("");
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} type="button" variant="secondary">
        <Plus size={18} />
        {t("tasks.addColumn")}
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} type="button" variant="secondary">
        <Plus size={18} />
        {t("tasks.addColumn")}
      </Button>
      <ModalShell
        description="Create a custom status lane for this board."
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        title={t("tasks.addColumn")}
      >
        <form className="task-board-add-column-form" onSubmit={(event) => void handleSubmit(event)}>
          <label className="auth-form__field" htmlFor="task-board-new-column">
            <span className="auth-form__label">Column name</span>
            <input
              autoFocus
              className="auth-form__input"
              id="task-board-new-column"
              onChange={(event) => setValue(event.target.value)}
              placeholder="Blocked"
              value={value}
            />
          </label>
          <div className="modal-action-row">
            <Button onClick={() => setIsOpen(false)} type="button" variant="ghost">
              {t("common.cancel")}
            </Button>
            <Button disabled={!value.trim()} type="submit">
              {t("common.save")}
            </Button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
