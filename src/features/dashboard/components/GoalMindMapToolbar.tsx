import { Expand, Link2, Plus, RotateCcw, Save, Target, Waypoints } from "lucide-react";
import { Panel } from "reactflow";
import { Button } from "@/components/common/Button";
import { useI18n } from "@/i18n";

interface GoalMindMapToolbarProps {
  canCreateTask: boolean;
  connectMode: boolean;
  onAddTask: () => void;
  onFitView: () => void;
  onLinkExistingTask: () => void;
  onResetLayout: () => void;
  onSaveLayout: () => void;
  onSelectGoal: () => void;
  onToggleConnectMode: () => void;
  saveStatus: "saved" | "saving" | "unsaved" | "failed";
}

export function GoalMindMapToolbar({
  canCreateTask,
  connectMode,
  onAddTask,
  onFitView,
  onLinkExistingTask,
  onResetLayout,
  onSaveLayout,
  onSelectGoal,
  onToggleConnectMode,
  saveStatus,
}: GoalMindMapToolbarProps): JSX.Element {
  const { direction, t } = useI18n();

  return (
    <Panel className="dashboard-mind-toolbar nodrag nopan" position={direction === "rtl" ? "top-right" : "top-left"}>
      <Button className="dashboard-mind-toolbar__button" onClick={onSelectGoal} type="button" variant="secondary">
        <Target size={16} />
        <span>{t("dashboard.selectGoal")}</span>
      </Button>
      <Button
        className="dashboard-mind-toolbar__button"
        disabled={!canCreateTask}
        onClick={onAddTask}
        type="button"
        variant="secondary"
      >
        <Plus size={16} />
        <span>{t("dashboard.addTaskNode")}</span>
      </Button>
      <Button
        className="dashboard-mind-toolbar__button"
        disabled={!canCreateTask}
        onClick={onLinkExistingTask}
        type="button"
        variant="secondary"
      >
        <Link2 size={16} />
        <span>{t("dashboard.linkExistingTask")}</span>
      </Button>
      <Button
        className="dashboard-mind-toolbar__button"
        onClick={onToggleConnectMode}
        type="button"
        variant={connectMode ? "primary" : "secondary"}
      >
        <Waypoints size={16} />
        <span>{t("dashboard.connectMode")}</span>
      </Button>
      <Button className="dashboard-mind-toolbar__button" onClick={onSaveLayout} type="button" variant="ghost">
        <Save size={16} />
        <span>{t("dashboard.saveLayout")}</span>
      </Button>
      <Button className="dashboard-mind-toolbar__button" onClick={onResetLayout} type="button" variant="ghost">
        <RotateCcw size={16} />
        <span>{t("dashboard.resetLayout")}</span>
      </Button>
      <Button className="dashboard-mind-toolbar__button" onClick={onFitView} type="button" variant="ghost">
        <Expand size={16} />
        <span>{t("dashboard.fitView")}</span>
      </Button>
      <span className={`dashboard-mind-toolbar__status dashboard-mind-toolbar__status--${saveStatus}`}>
        {getSaveStatusLabel(saveStatus, t)}
      </span>
    </Panel>
  );
}

function getSaveStatusLabel(saveStatus: GoalMindMapToolbarProps["saveStatus"], t: ReturnType<typeof useI18n>["t"]): string {
  switch (saveStatus) {
    case "saving":
      return t("common.saving");
    case "unsaved":
      return t("common.unsavedChanges");
    case "failed":
      return t("common.saveFailed");
    case "saved":
    default:
      return t("common.saved");
  }
}
