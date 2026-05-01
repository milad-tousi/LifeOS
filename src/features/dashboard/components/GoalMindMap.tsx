import { useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  ReactFlowInstance,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Task } from "@/domains/tasks/types";
import { GoalMindMapControls } from "@/features/dashboard/components/GoalMindMapControls";
import { GoalNode } from "@/features/dashboard/components/GoalNode";
import { TaskNode } from "@/features/dashboard/components/TaskNode";
import { LinkExistingTaskModal } from "@/features/dashboard/components/LinkExistingTaskModal";
import { CreateMindMapTaskModal } from "@/features/dashboard/components/CreateMindMapTaskModal";
import {
  GoalMindMapData,
  GoalMindMapNodeData,
} from "@/features/dashboard/types/dashboard.types";
import { GoalCardData } from "@/features/goals/hooks/useGoals";

interface GoalMindMapProps {
  data: GoalMindMapData;
  goals: GoalCardData[];
  onCreateTask: (input: { dueDate?: string; priority: Task["priority"]; title: string }) => void;
  onLinkTasks: (taskIds: string[]) => void;
  onSelectGoal: (goalId: string) => void;
  selectedGoalId: string;
  tasks: Task[];
}

const nodeTypes = {
  goalNode: GoalNode,
  taskNode: TaskNode,
};

export function GoalMindMap(props: GoalMindMapProps): JSX.Element {
  return (
    <ReactFlowProvider>
      <GoalMindMapInner {...props} />
    </ReactFlowProvider>
  );
}

function GoalMindMapInner({
  data,
  goals,
  onCreateTask,
  onLinkTasks,
  onSelectGoal,
  selectedGoalId,
  tasks,
}: GoalMindMapProps): JSX.Element {
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const flowRef = useRef<ReactFlowInstance<GoalMindMapNodeData> | null>(null);
  const { edges, nodes } = useMemo(() => buildMindMapElements(data), [data]);
  const linkableTasks = tasks.filter((task) => task.goalId !== selectedGoalId);

  function fitView(): void {
    flowRef.current?.fitView({ duration: 300, padding: 0.2 });
  }

  return (
    <section className="dashboard-card dashboard-mind-map">
      <div className="dashboard-card__header">
        <div>
          <h2>Goal Mind Map</h2>
          <p>Visualize a goal as the center and connect real tasks around it.</p>
        </div>
      </div>
      <GoalMindMapControls
        goals={goals}
        onCreateTask={() => setIsCreateOpen(true)}
        onFitView={fitView}
        onLinkTask={() => setIsLinkOpen(true)}
        onResetLayout={fitView}
        onSelectGoal={onSelectGoal}
        selectedGoalId={selectedGoalId}
      />
      <div className="dashboard-mind-map__canvas">
        <ReactFlow
          edges={edges}
          fitView
          nodes={nodes}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            flowRef.current = instance;
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <LinkExistingTaskModal
        isOpen={isLinkOpen}
        onClose={() => setIsLinkOpen(false)}
        onSubmit={(taskIds) => {
          onLinkTasks(taskIds);
          setIsLinkOpen(false);
        }}
        tasks={linkableTasks}
      />
      <CreateMindMapTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(input) => {
          onCreateTask(input);
          setIsCreateOpen(false);
        }}
      />
    </section>
  );
}

function buildMindMapElements(data: GoalMindMapData): {
  edges: Edge[];
  nodes: Array<Node<GoalMindMapNodeData>>;
} {
  const goalNode: Node<GoalMindMapNodeData> = {
    id: "goal",
    type: "goalNode",
    position: { x: 360, y: 220 },
    data: data.goal
      ? {
          goalId: data.goal.id,
          progress: data.goal.progress,
          status: data.goal.status,
          title: data.goal.title,
        }
      : {
          isPlaceholder: true,
          title: "Select a Goal",
        },
  };
  const radius = 260;
  const taskNodes = data.tasks.map((task, index) => {
    const angle = (index / Math.max(data.tasks.length, 1)) * Math.PI * 2;
    return {
      id: task.id,
      type: "taskNode",
      position: {
        x: 360 + Math.cos(angle) * radius,
        y: 220 + Math.sin(angle) * 160,
      },
      data: {
        dueDate: task.dueDate,
        isOverdue: task.isOverdue,
        priority: task.priority,
        status: task.status,
        taskId: task.id,
        title: task.title,
      },
    } satisfies Node<GoalMindMapNodeData>;
  });
  const edges = taskNodes.map((node) => ({
    id: `goal-${node.id}`,
    source: "goal",
    target: node.id,
    animated: false,
  }));

  return {
    nodes: [goalNode, ...taskNodes],
    edges,
  };
}
