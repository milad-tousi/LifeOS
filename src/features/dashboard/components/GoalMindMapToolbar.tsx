import { Expand, Link2, Plus, RotateCcw, Save, Target, Waypoints } from "lucide-react";
import { Panel } from "reactflow";
import { Button } from "@/components/common/Button";

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
}: GoalMindMapToolbarProps): JSX.Element {
  return (
    <Panel className="dashboard-mind-toolbar nodrag nopan" position="top-left">
      <Button className="dashboard-mind-toolbar__button" onClick={onSelectGoal} type="button" variant="secondary">
        <Target size={16} />
        <span>Select Goal</span>
      </Button>
      <Button
        className="dashboard-mind-toolbar__button"
        disabled={!canCreateTask}
        onClick={onAddTask}
        type="button"
        variant="secondary"
      >
        <Plus size={16} />
        <span>Add Task Node</span>
      </Button>
      <Button
        className="dashboard-mind-toolbar__button"
        disabled={!canCreateTask}
        onClick={onLinkExistingTask}
        type="button"
        variant="secondary"
      >
        <Link2 size={16} />
        <span>Link Existing Task</span>
      </Button>
      <Button
        className="dashboard-mind-toolbar__button"
        onClick={onToggleConnectMode}
        type="button"
        variant={connectMode ? "primary" : "secondary"}
      >
        <Waypoints size={16} />
        <span>Connect Mode</span>
      </Button>
      <Button className="dashboard-mind-toolbar__button" onClick={onSaveLayout} type="button" variant="ghost">
        <Save size={16} />
        <span>Save Layout</span>
      </Button>
      <Button className="dashboard-mind-toolbar__button" onClick={onResetLayout} type="button" variant="ghost">
        <RotateCcw size={16} />
        <span>Reset Layout</span>
      </Button>
      <Button className="dashboard-mind-toolbar__button" onClick={onFitView} type="button" variant="ghost">
        <Expand size={16} />
        <span>Fit View</span>
      </Button>
    </Panel>
  );
}
