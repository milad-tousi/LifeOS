import { NodeProps } from "reactflow";
import { GoalMindMapNodeData } from "@/features/dashboard/types/dashboard.types";

export function TaskNode({ data }: NodeProps<GoalMindMapNodeData>): JSX.Element {
  const classes = [
    "dashboard-mind-node",
    "dashboard-mind-node--task",
    data.status === "done" ? "dashboard-mind-node--done" : "",
    data.isOverdue ? "dashboard-mind-node--overdue" : "",
    data.priority === "high" ? "dashboard-mind-node--high" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <span>{data.priority} priority</span>
      <strong>{data.title}</strong>
      <p>{data.status}{data.dueDate ? ` • ${data.dueDate}` : ""}</p>
    </div>
  );
}
