import { NodeProps } from "reactflow";
import { GoalMindMapNodeData } from "@/features/dashboard/types/dashboard.types";

export function GoalNode({ data }: NodeProps<GoalMindMapNodeData>): JSX.Element {
  return (
    <div className="dashboard-mind-node dashboard-mind-node--goal">
      <span>{data.isPlaceholder ? "Goal Mind Map" : data.status}</span>
      <strong>{data.title}</strong>
      {typeof data.progress === "number" ? <p>{data.progress}% progress</p> : null}
    </div>
  );
}
