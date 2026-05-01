import { Handle, NodeProps, Position } from "reactflow";
import { GoalMindMapGoalNodeData } from "@/features/dashboard/types/goalMindMap.types";

export function GoalMindMapGoalNode({ data, selected }: NodeProps<GoalMindMapGoalNodeData>): JSX.Element {
  return (
    <button
      className={`dashboard-mind-node dashboard-mind-node--goal${selected ? " dashboard-mind-node--selected" : ""}`}
      onClick={data.onSelectGoal}
      onDoubleClick={data.onSelectGoal}
      type="button"
    >
      <Handle className="dashboard-mind-handle" position={Position.Top} type="target" />
      <Handle className="dashboard-mind-handle" position={Position.Bottom} type="source" />
      <span>{data.status ?? "Goal"}</span>
      <strong>{data.title}</strong>
      <p>{data.subtitle}</p>
      {typeof data.progress === "number" ? (
        <div aria-label={`${data.progress}% progress`} className="dashboard-mind-node__progress">
          <span style={{ width: `${data.progress}%` }} />
        </div>
      ) : null}
    </button>
  );
}
