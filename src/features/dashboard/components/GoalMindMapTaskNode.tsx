import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Handle, NodeProps, Position } from "reactflow";
import { GoalMindMapTaskNodeData } from "@/features/dashboard/types/goalMindMap.types";
import { useI18n } from "@/i18n";

export function GoalMindMapTaskNode({ data, selected }: NodeProps<GoalMindMapTaskNodeData>): JSX.Element {
  const { t } = useI18n();
  const classes = [
    "dashboard-mind-node",
    "dashboard-mind-node--task",
    data.isSubtask ? "dashboard-mind-node--subtask" : "",
    data.status === "done" ? "dashboard-mind-node--done" : "",
    data.isOverdue ? "dashboard-mind-node--overdue" : "",
    data.priority === "high" ? "dashboard-mind-node--high" : "",
    selected ? "dashboard-mind-node--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} onDoubleClick={() => data.onEditTask(data.taskId)} role="button" tabIndex={0}>
      <Handle className="dashboard-mind-handle" position={Position.Top} type="target" />
      <Handle className="dashboard-mind-handle" position={Position.Bottom} type="source" />
      <div className="dashboard-mind-node__actions nodrag">
        <button
          aria-label={t("common.edit")}
          className="dashboard-mind-node__action nodrag"
          onClick={(event) => {
            event.stopPropagation();
            data.onEditTask(data.taskId);
          }}
          type="button"
        >
          <Pencil size={14} />
        </button>
        <button
          aria-label={t("common.remove")}
          className="dashboard-mind-node__action nodrag"
          onClick={(event) => {
            event.stopPropagation();
            data.onRemoveTask(data.taskId);
          }}
          type="button"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="dashboard-mind-node__meta">
        <span>{t("common.priority")}: {data.priority}</span>
        {data.isSubtask ? <span className="dashboard-mind-node__badge">{t("tasks.subtask")}</span> : null}
      </div>
      <strong>
        {data.status === "done" ? <CheckCircle2 size={15} /> : null}
        {data.title}
      </strong>
      <p>
        {data.status}
        {data.dueDate ? ` - ${data.dueDate}` : ""}
      </p>
    </div>
  );
}
