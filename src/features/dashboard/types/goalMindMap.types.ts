import { Edge, Node, XYPosition } from "reactflow";
import { GoalStatus } from "@/domains/goals/types";
import { Task, TaskPriority, TaskStatus } from "@/domains/tasks/types";

export type GoalMindMapNodeKind = "goal" | "task";

export interface GoalMindMapStoredEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface GoalMindMapLayout {
  edges: GoalMindMapStoredEdge[];
  nodePositions: Record<string, XYPosition>;
  selectedGoalId: string;
}

export interface GoalMindMapGoalNodeData {
  kind: "goal";
  goalId?: string;
  progress?: number;
  status?: GoalStatus;
  title: string;
  subtitle: string;
  onSelectGoal: () => void;
}

export interface GoalMindMapTaskNodeData {
  kind: "task";
  dueDate?: string;
  isOverdue: boolean;
  isSubtask: boolean;
  level: number;
  parentTaskId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  taskId: string;
  title: string;
  onEditTask: (taskId: string) => void;
}

export type GoalMindMapNodeData = GoalMindMapGoalNodeData | GoalMindMapTaskNodeData;

export type GoalMindMapNode = Node<GoalMindMapNodeData>;
export type GoalMindMapEdge = Edge;

export interface CreateMindMapTaskInput {
  dueDate?: string;
  goalId?: string;
  parentTaskId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
}

export interface EditMindMapTaskInput extends CreateMindMapTaskInput {
  taskId: string;
}

export interface MindMapTaskOption extends Task {
  isRepresented: boolean;
}
