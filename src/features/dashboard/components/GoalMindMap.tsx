import {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  Background,
  Connection,
  ConnectionMode,
  Controls,
  EdgeChange,
  NodeChange,
  OnConnectStartParams,
  ReactFlowInstance,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/common/Button";
import { ModalShell } from "@/components/common/ModalShell";
import { Task } from "@/domains/tasks/types";
import { GoalMindMapGoalNode } from "@/features/dashboard/components/GoalMindMapGoalNode";
import { GoalMindMapTaskNode } from "@/features/dashboard/components/GoalMindMapTaskNode";
import { GoalMindMapToolbar } from "@/features/dashboard/components/GoalMindMapToolbar";
import { LinkExistingTaskModal } from "@/features/dashboard/components/LinkExistingTaskModal";
import { CreateMindMapTaskModal } from "@/features/dashboard/components/CreateMindMapTaskModal";
import {
  CreateMindMapTaskInput,
  EditMindMapTaskInput,
  GoalMindMapEdge,
  GoalMindMapNode,
} from "@/features/dashboard/types/goalMindMap.types";
import {
  loadGoalMindMapLayout,
  mergeGoalMindMapLayout,
  saveGoalMindMapLayout,
  toStoredEdges,
} from "@/features/dashboard/utils/goalMindMapStorage";
import {
  canConnectMindMapNodes,
  getTaskIdFromMindMapNodeId,
  getTaskLevel,
} from "@/features/dashboard/utils/goalMindMapRules";
import { GoalCardData } from "@/features/goals/hooks/useGoals";

interface GoalMindMapProps {
  goals: GoalCardData[];
  onCreateTask: (input: CreateMindMapTaskInput) => Promise<Task | undefined>;
  onLinkTasks: (taskIds: string[]) => Promise<void>;
  onNavigateToGoals: () => void;
  onSelectGoal: (goalId: string) => void;
  onUpdateTask: (input: EditMindMapTaskInput) => Promise<void>;
  selectedGoalId: string;
  tasks: Task[];
}

const GOAL_NODE_ID = "goal";

interface PendingCreation {
  mode: "task" | "subtask";
  sourceNodeId: string;
}

const nodeTypes = {
  goalNode: GoalMindMapGoalNode,
  taskNode: GoalMindMapTaskNode,
};

export function GoalMindMap(props: GoalMindMapProps): JSX.Element {
  return (
    <ReactFlowProvider>
      <GoalMindMapInner {...props} />
    </ReactFlowProvider>
  );
}

function GoalMindMapInner({
  goals,
  onCreateTask,
  onLinkTasks,
  onNavigateToGoals,
  onSelectGoal,
  onUpdateTask,
  selectedGoalId,
  tasks,
}: GoalMindMapProps): JSX.Element {
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGoalSelectOpen, setIsGoalSelectOpen] = useState(false);
  const [connectMode, setConnectMode] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [pendingCreation, setPendingCreation] = useState<PendingCreation>({
    mode: "task",
    sourceNodeId: GOAL_NODE_ID,
  });
  const [pendingNodePosition, setPendingNodePosition] = useState({ x: 640, y: 260 });
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const fitGoalRef = useRef<string | null>(null);
  const connectionStartRef = useRef<OnConnectStartParams | null>(null);
  const connectionCompletedRef = useRef(false);
  const { screenToFlowPosition } = useReactFlow();
  const selectedGoal = goals.find((goal) => goal.goal.id === selectedGoalId);
  const linkedTasks = useMemo(
    () => (selectedGoalId ? tasks.filter((task) => task.goalId === selectedGoalId) : []),
    [selectedGoalId, tasks],
  );
  const representedTaskIds = new Set(linkedTasks.map((task) => task.id));
  const linkableTasks = tasks.filter((task) => !representedTaskIds.has(task.id));
  const editingTask = editingTaskId ? tasks.find((task) => task.id === editingTaskId) : undefined;
  const todayKey = getDateKey(new Date());

  const editInitialValue: EditMindMapTaskInput | undefined = editingTask
    ? {
        dueDate: editingTask.dueDate,
        priority: editingTask.priority,
        status: editingTask.status,
        taskId: editingTask.id,
        title: editingTask.title,
      }
    : undefined;

  const [nodes, setNodes] = useNodesState<GoalMindMapNode["data"]>([]);
  const [edges, setEdges] = useEdgesState([]);

  const validNodeIds = useMemo(() => {
    const ids = new Set([GOAL_NODE_ID]);
    linkedTasks.forEach((task) => ids.add(getTaskNodeId(task.id)));
    return ids;
  }, [linkedTasks]);

  const showConnectionMessage = useCallback((message: string): void => {
    setConnectionMessage(message);
    window.setTimeout(() => {
      setConnectionMessage((currentMessage) => (currentMessage === message ? "" : currentMessage));
    }, 2600);
  }, []);

  const persistCurrentLayout = useCallback(
    (nextNodes: GoalMindMapNode[] = nodes, nextEdges: GoalMindMapEdge[] = edges): void => {
      const currentLayout = loadGoalMindMapLayout();
      const nodePositions = { ...currentLayout.nodePositions };
      nextNodes.forEach((node) => {
        nodePositions[node.id] = node.position;
      });
      saveGoalMindMapLayout({
        selectedGoalId,
        nodePositions,
        edges: toStoredEdges(nextEdges),
      });
    },
    [edges, nodes, selectedGoalId],
  );

  const openTaskEditor = useCallback((taskId: string): void => {
    setEditingTaskId(taskId);
  }, []);

  const openGoalSelector = useCallback((): void => {
    setIsGoalSelectOpen(true);
  }, []);

  useEffect(() => {
    const layout = loadGoalMindMapLayout();
    const nextNodes = buildNodes({
      linkedTasks,
      onEditTask: openTaskEditor,
      onSelectGoal: openGoalSelector,
      selectedGoal,
      todayKey,
    });
    const positionedNodes = nextNodes.map((node, index) => ({
      ...node,
      position:
        layout.nodePositions[node.id] ??
        getHierarchicalNodePositions(nextNodes, linkedTasks)[node.id] ??
        getDefaultNodePosition(index, nextNodes.length, node.id === GOAL_NODE_ID),
    }));
    const cleanedEdges = buildEdges({
      layoutEdges: layout.edges,
      nodes: positionedNodes,
      tasks: linkedTasks,
    });

    setNodes(positionedNodes);
    setEdges(cleanedEdges);
    saveGoalMindMapLayout({
      selectedGoalId,
      nodePositions: {
        ...layout.nodePositions,
        ...Object.fromEntries(positionedNodes.map((node) => [node.id, node.position])),
      },
      edges: toStoredEdges(cleanedEdges),
    });
  }, [linkedTasks, openGoalSelector, openTaskEditor, selectedGoal, selectedGoalId, setEdges, setNodes, todayKey]);

  useEffect(() => {
    if (selectedGoalId && fitGoalRef.current !== selectedGoalId && nodes.length > 0) {
      fitGoalRef.current = selectedGoalId;
      window.setTimeout(() => flowRef.current?.fitView({ duration: 250, padding: 0.22 }), 0);
    }
  }, [nodes.length, selectedGoalId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        persistCurrentLayout();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [persistCurrentLayout]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]): void => {
      const nonDeleteChanges = changes.filter((change) => change.type !== "remove");
      setNodes((currentNodes) => {
        const nextNodes = applyNodeChanges(nonDeleteChanges, currentNodes);
        persistCurrentLayout(nextNodes, edges);
        return nextNodes;
      });
    },
    [edges, persistCurrentLayout, setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]): void => {
      setEdges((currentEdges) => {
        const nextEdges = applyEdgeChanges(changes, currentEdges).filter(
          (edge) =>
            validNodeIds.has(edge.source) &&
            validNodeIds.has(edge.target) &&
            canConnectMindMapNodes(
              nodes.find((node) => node.id === edge.source),
              nodes.find((node) => node.id === edge.target),
              linkedTasks,
            ),
        );
        persistCurrentLayout(nodes, nextEdges);
        return nextEdges;
      });
    },
    [linkedTasks, nodes, persistCurrentLayout, setEdges, validNodeIds],
  );

  const handleConnect = useCallback(
    (connection: Connection): void => {
      connectionCompletedRef.current = true;

      if (!connection.source || !connection.target || connection.source === connection.target) {
        return;
      }

      const source = connection.source;
      const target = connection.target;
      const sourceNode = nodes.find((node) => node.id === source);
      const targetNode = nodes.find((node) => node.id === target);

      if (!canConnectMindMapNodes(sourceNode, targetNode, linkedTasks)) {
        showConnectionMessage("Goals can only connect to top-level tasks.");
        return;
      }

      setEdges((currentEdges) => {
        const hasDuplicate = currentEdges.some(
          (edge) => edge.source === source && edge.target === target,
        );
        if (hasDuplicate) {
          return currentEdges;
        }

        const nextEdges = addEdge(
          {
            ...connection,
            id: getEdgeId(source, target),
            type: "smoothstep",
          },
          currentEdges,
        );
        persistCurrentLayout(nodes, nextEdges);
        return nextEdges;
      });
    },
    [linkedTasks, nodes, persistCurrentLayout, setEdges, showConnectionMessage],
  );

  const handleConnectStart = useCallback(
    (_event: ReactMouseEvent | ReactTouchEvent, params: OnConnectStartParams): void => {
      connectionCompletedRef.current = false;
      connectionStartRef.current = params;
    },
    [],
  );

  const handleConnectEnd = useCallback(
    (event: globalThis.MouseEvent | TouchEvent): void => {
      const startParams = connectionStartRef.current;
      connectionStartRef.current = null;

      if (connectionCompletedRef.current || !startParams?.nodeId || startParams.handleType !== "source") {
        connectionCompletedRef.current = false;
        return;
      }

      connectionCompletedRef.current = false;

      const target = event.target instanceof Element ? event.target : null;
      const endedOnEmptyPane = Boolean(target?.closest(".react-flow__pane")) && !target?.closest(".react-flow__node");

      if (!endedOnEmptyPane || !selectedGoalId) {
        return;
      }

      const pointerPosition = getEventClientPosition(event);
      if (!pointerPosition) {
        return;
      }

      if (startParams.nodeId === GOAL_NODE_ID) {
        setPendingCreation({ mode: "task", sourceNodeId: GOAL_NODE_ID });
        setPendingNodePosition(screenToFlowPosition(pointerPosition));
        setIsCreateOpen(true);
        return;
      }

      if (startParams.nodeId.startsWith("task-")) {
        setPendingCreation({ mode: "subtask", sourceNodeId: startParams.nodeId });
        setPendingNodePosition(screenToFlowPosition(pointerPosition));
        setIsCreateOpen(true);
      }
    },
    [screenToFlowPosition, selectedGoalId],
  );

  function fitView(): void {
    flowRef.current?.fitView({ duration: 300, padding: 0.22 });
  }

  function resetLayout(): void {
    const hierarchicalPositions = getHierarchicalNodePositions(nodes, linkedTasks);
    const nextNodes = nodes.map((node, index) => ({
      ...node,
      position:
        hierarchicalPositions[node.id] ??
        getDefaultNodePosition(index, nodes.length, node.id === GOAL_NODE_ID),
    }));
    const nextEdges = buildDefaultHierarchyEdges(linkedTasks);

    setNodes(nextNodes);
    setEdges(nextEdges);
    const layout = loadGoalMindMapLayout();
    saveGoalMindMapLayout({
      selectedGoalId,
      nodePositions: {
        ...layout.nodePositions,
        ...Object.fromEntries(nextNodes.map((node) => [node.id, node.position])),
      },
      edges: toStoredEdges(nextEdges),
    });
    window.setTimeout(fitView, 0);
  }

  function handlePaneDoubleClick(event: ReactMouseEvent): void {
    if ((event.target as HTMLElement).closest(".react-flow__node")) {
      return;
    }

    if (!selectedGoalId) {
      setIsGoalSelectOpen(true);
      return;
    }

    setPendingCreation({ mode: "task", sourceNodeId: GOAL_NODE_ID });
    setPendingNodePosition(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    setIsCreateOpen(true);
  }

  async function handleCreateTask(input: CreateMindMapTaskInput): Promise<void> {
    const parentTaskId =
      pendingCreation.mode === "subtask" ? getTaskIdFromNodeId(pendingCreation.sourceNodeId) : undefined;
    const parentTask = parentTaskId ? tasks.find((taskItem) => taskItem.id === parentTaskId) : undefined;
    const task = await onCreateTask({
      ...input,
      goalId: parentTask?.goalId ?? selectedGoalId,
      parentTaskId,
    });

    if (task) {
      const taskNodeId = getTaskNodeId(task.id);
      const edgeSource = pendingCreation.mode === "subtask" ? pendingCreation.sourceNodeId : GOAL_NODE_ID;
      const nextEdge = {
        id: getEdgeId(edgeSource, taskNodeId),
        source: edgeSource,
        target: taskNodeId,
        type: "smoothstep",
      };
      const nextEdges = edges.some((edge) => edge.id === nextEdge.id) ? edges : [...edges, nextEdge];
      mergeGoalMindMapLayout({
        nodePositions: {
          ...loadGoalMindMapLayout().nodePositions,
          [taskNodeId]: pendingNodePosition,
        },
        edges: toStoredEdges(nextEdges),
        selectedGoalId,
      });
    }
    setIsCreateOpen(false);
    setPendingCreation({ mode: "task", sourceNodeId: GOAL_NODE_ID });
  }

  async function handleLinkTasks(taskIds: string[]): Promise<void> {
    await onLinkTasks(taskIds);
    const layout = loadGoalMindMapLayout();
    const nodePositions = { ...layout.nodePositions };
    const nextEdges = [...edges];
    taskIds.forEach((taskId, index) => {
      const task = tasks.find((item) => item.id === taskId);
      const taskNodeId = getTaskNodeId(taskId);
      nodePositions[taskNodeId] = nodePositions[taskNodeId] ?? getDefaultNodePosition(nodes.length + index, nodes.length + taskIds.length, false);
      const sourceNodeId = task?.parentTaskId ? getTaskNodeId(task.parentTaskId) : GOAL_NODE_ID;
      const edgeId = getEdgeId(sourceNodeId, taskNodeId);
      const sourceNode = nodes.find((node) => node.id === sourceNodeId);
      const targetNode = nodes.find((node) => node.id === taskNodeId) ?? {
        id: taskNodeId,
        type: "taskNode",
        position: nodePositions[taskNodeId],
        data: {
          dueDate: task?.dueDate,
          isOverdue: task ? isTaskOverdue(task, todayKey) : false,
          isSubtask: Boolean(task?.parentTaskId),
          kind: "task" as const,
          level: task ? getTaskLevel(task, linkedTasks) : 0,
          onEditTask: openTaskEditor,
          parentTaskId: task?.parentTaskId,
          priority: task?.priority ?? "medium",
          status: task?.status ?? "todo",
          taskId,
          title: task?.title ?? "Task",
        },
      };

      if (
        !nextEdges.some((edge) => edge.id === edgeId) &&
        canConnectMindMapNodes(sourceNode, targetNode, linkedTasks)
      ) {
        nextEdges.push({ id: edgeId, source: sourceNodeId, target: taskNodeId, type: "smoothstep" });
      }
    });
    mergeGoalMindMapLayout({ edges: toStoredEdges(nextEdges), nodePositions, selectedGoalId });
    setIsLinkOpen(false);
  }

  async function handleEditTask(input: CreateMindMapTaskInput): Promise<void> {
    if (!editingTaskId) {
      return;
    }

    await onUpdateTask({ ...input, taskId: editingTaskId });
    setEditingTaskId(null);
  }

  return (
    <section className="dashboard-card dashboard-mind-map">
      <div className="dashboard-card__header dashboard-mind-map__header">
        <div>
          <h2>Goal Mind Map</h2>
          <p>Build a goal-centered plan by creating, dragging, linking, and connecting real tasks.</p>
        </div>
      </div>
      <div className="dashboard-mind-map__canvas">
        <ReactFlow
          className="dashboard-mind-map__flow"
          connectionMode={ConnectionMode.Loose}
          deleteKeyCode={["Backspace", "Delete"]}
          edges={edges}
          edgesFocusable
          elementsSelectable
          nodes={nodes}
          nodesConnectable={connectMode}
          nodesDraggable
          nodesFocusable
          nodeTypes={nodeTypes}
          onConnect={connectMode ? handleConnect : undefined}
          onConnectEnd={connectMode ? handleConnectEnd : undefined}
          onConnectStart={connectMode ? handleConnectStart : undefined}
          onEdgesChange={handleEdgesChange}
          onInit={(instance) => {
            flowRef.current = instance;
          }}
          onNodesChange={handleNodesChange}
          onDoubleClick={handlePaneDoubleClick}
          panOnDrag={[1, 2]}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={22} size={1} />
          <Controls position="bottom-right" />
          <GoalMindMapToolbar
            canCreateTask={Boolean(selectedGoalId)}
            connectMode={connectMode}
            onAddTask={() => {
              setPendingCreation({ mode: "task", sourceNodeId: GOAL_NODE_ID });
              setPendingNodePosition({ x: 640, y: 260 });
              setIsCreateOpen(true);
            }}
            onFitView={fitView}
            onLinkExistingTask={() => setIsLinkOpen(true)}
            onResetLayout={resetLayout}
            onSaveLayout={() => persistCurrentLayout()}
            onSelectGoal={() => setIsGoalSelectOpen(true)}
            onToggleConnectMode={() => setConnectMode((current) => !current)}
          />
          {goals.length === 0 ? (
            <div className="dashboard-mind-empty nodrag nopan">
              <strong>Create a goal first to build a mind map.</strong>
              <Button onClick={onNavigateToGoals} type="button">
                Go to Goals
              </Button>
            </div>
          ) : selectedGoalId && linkedTasks.length === 0 ? (
            <div className="dashboard-mind-hint nodrag nopan">Add or link tasks to start building your plan.</div>
          ) : null}
          {connectionMessage ? (
            <div className="dashboard-mind-message nodrag nopan">{connectionMessage}</div>
          ) : null}
        </ReactFlow>
      </div>
      <GoalSelectorModal
        goals={goals}
        isOpen={isGoalSelectOpen}
        onClose={() => setIsGoalSelectOpen(false)}
        onSelect={(goalId) => {
          onSelectGoal(goalId);
          mergeGoalMindMapLayout({ selectedGoalId: goalId });
          setIsGoalSelectOpen(false);
        }}
        selectedGoalId={selectedGoalId}
      />
      <LinkExistingTaskModal
        isOpen={isLinkOpen}
        onClose={() => setIsLinkOpen(false)}
        onSubmit={(taskIds) => {
          void handleLinkTasks(taskIds);
        }}
        tasks={linkableTasks}
      />
      <CreateMindMapTaskModal
        initialValue={editInitialValue}
        isOpen={isCreateOpen || Boolean(editingTaskId)}
        mode={pendingCreation.mode}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingTaskId(null);
          setPendingCreation({ mode: "task", sourceNodeId: GOAL_NODE_ID });
        }}
        onSubmit={(input) => {
          if (editingTaskId) {
            void handleEditTask(input);
            return;
          }
          void handleCreateTask(input);
        }}
      />
    </section>
  );
}

interface BuildNodesInput {
  linkedTasks: Task[];
  onEditTask: (taskId: string) => void;
  onSelectGoal: () => void;
  selectedGoal?: GoalCardData;
  todayKey: string;
}

function buildNodes({
  linkedTasks,
  onEditTask,
  onSelectGoal,
  selectedGoal,
  todayKey,
}: BuildNodesInput): GoalMindMapNode[] {
  const goalNode: GoalMindMapNode = {
    id: GOAL_NODE_ID,
    type: "goalNode",
    position: { x: 360, y: 220 },
    data: selectedGoal
      ? {
          goalId: selectedGoal.goal.id,
          kind: "goal",
          onSelectGoal,
          progress: selectedGoal.overallProgress,
          status: selectedGoal.goal.status,
          subtitle: "Click to change goal",
          title: selectedGoal.goal.title,
        }
      : {
          kind: "goal",
          onSelectGoal,
          subtitle: "Click to choose a goal",
          title: "Select Goal",
        },
  };
  const taskNodes = linkedTasks.map((task) => ({
    id: getTaskNodeId(task.id),
    type: "taskNode",
    position: { x: 0, y: 0 },
    data: {
      dueDate: task.dueDate,
      isOverdue: isTaskOverdue(task, todayKey),
      isSubtask: Boolean(task.parentTaskId),
      kind: "task" as const,
      level: getTaskLevel(task, linkedTasks),
      onEditTask,
      parentTaskId: task.parentTaskId,
      priority: task.priority,
      status: task.status,
      taskId: task.id,
      title: task.title,
    },
  }));

  return [goalNode, ...taskNodes];
}

function buildEdges({
  layoutEdges,
  nodes,
  tasks,
}: {
  layoutEdges: Array<{ id: string; source: string; target: string; type?: string }>;
  nodes: GoalMindMapNode[];
  tasks: Task[];
}): GoalMindMapEdge[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const cleanedStoredEdges: GoalMindMapEdge[] = layoutEdges
    .filter((edge) =>
      canConnectMindMapNodes(nodesById.get(edge.source), nodesById.get(edge.target), tasks),
    )
    .map((edge) => ({ ...edge, type: edge.type ?? "smoothstep" }));
  const edgesById = new Map<string, GoalMindMapEdge>(cleanedStoredEdges.map((edge) => [edge.id, edge]));

  buildDefaultHierarchyEdges(tasks).forEach((edge) => {
    if (!edgesById.has(edge.id)) {
      edgesById.set(edge.id, edge);
    }
  });

  return Array.from(edgesById.values());
}

function buildDefaultHierarchyEdges(tasks: Task[]): GoalMindMapEdge[] {
  const taskIds = new Set(tasks.map((task) => task.id));

  return tasks.flatMap((task) => {
    const taskNodeId = getTaskNodeId(task.id);

    if (task.parentTaskId) {
      if (!taskIds.has(task.parentTaskId)) {
        return [];
      }

      const sourceNodeId = getTaskNodeId(task.parentTaskId);
      return [{
        id: getEdgeId(sourceNodeId, taskNodeId),
        source: sourceNodeId,
        target: taskNodeId,
        type: "smoothstep",
      }];
    }

    const sourceNodeId = task.parentTaskId ? getTaskNodeId(task.parentTaskId) : GOAL_NODE_ID;
    return [{
      id: getEdgeId(sourceNodeId, taskNodeId),
      source: sourceNodeId,
      target: taskNodeId,
      type: "smoothstep",
    }];
  });
}

function getDefaultNodePosition(index: number, total: number, isGoalNode: boolean): { x: number; y: number } {
  if (isGoalNode) {
    return { x: 360, y: 220 };
  }

  const radiusX = 310;
  const radiusY = 190;
  const taskIndex = Math.max(index - 1, 0);
  const taskTotal = Math.max(total - 1, 1);
  const angle = (taskIndex / taskTotal) * Math.PI * 2 - Math.PI / 2;

  return {
    x: 360 + Math.cos(angle) * radiusX,
    y: 220 + Math.sin(angle) * radiusY,
  };
}

function getHierarchicalNodePositions(nodes: GoalMindMapNode[], tasks: Task[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {
    [GOAL_NODE_ID]: { x: 360, y: 80 },
  };
  const taskNodes = nodes.filter((node) => node.id !== GOAL_NODE_ID);
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const childrenByParentId = new Map<string, Task[]>();
  const topLevelTasks: Task[] = [];

  tasks.forEach((task) => {
    if (!task.parentTaskId || !tasksById.has(task.parentTaskId)) {
      topLevelTasks.push(task);
      return;
    }

    const currentChildren = childrenByParentId.get(task.parentTaskId) ?? [];
    currentChildren.push(task);
    childrenByParentId.set(task.parentTaskId, currentChildren);
  });

  const horizontalGap = 260;
  const verticalGap = 170;
  const centerX = 360;
  const firstLevelY = 260;

  topLevelTasks.forEach((task, index) => {
    const x = centerX + (index - (topLevelTasks.length - 1) / 2) * horizontalGap;
    assignTaskTreePositions(task, x, firstLevelY, 0);
  });

  taskNodes.forEach((node, index) => {
    positions[node.id] = positions[node.id] ?? {
      x: centerX + (index - (taskNodes.length - 1) / 2) * horizontalGap,
      y: firstLevelY,
    };
  });

  return positions;

  function assignTaskTreePositions(task: Task, x: number, y: number, depth: number): void {
    positions[getTaskNodeId(task.id)] = { x, y };
    const children = childrenByParentId.get(task.id) ?? [];
    const childGap = Math.max(180, horizontalGap - depth * 35);

    children.forEach((childTask, childIndex) => {
      const childX = x + (childIndex - (children.length - 1) / 2) * childGap;
      assignTaskTreePositions(childTask, childX, y + verticalGap, depth + 1);
    });
  }
}

function getTaskNodeId(taskId: string): string {
  return `task-${taskId}`;
}

function getTaskIdFromNodeId(nodeId: string): string {
  return getTaskIdFromMindMapNodeId(nodeId);
}

function getEdgeId(source: string, target: string): string {
  return `${source}-${target}`;
}

function getEventClientPosition(event: globalThis.MouseEvent | TouchEvent): { x: number; y: number } | null {
  if ("clientX" in event) {
    return { x: event.clientX, y: event.clientY };
  }

  const touch = event.changedTouches[0] ?? event.touches[0];
  return touch ? { x: touch.clientX, y: touch.clientY } : null;
}

function isTaskOverdue(task: Task, todayKey: string): boolean {
  const dueDate = task.dueDate ?? task.scheduledDate;
  return Boolean(dueDate && dueDate < todayKey && task.status !== "done" && task.status !== "cancelled");
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function GoalSelectorModal({
  goals,
  isOpen,
  onClose,
  onSelect,
  selectedGoalId,
}: {
  goals: GoalCardData[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (goalId: string) => void;
  selectedGoalId: string;
}): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalShell
      description="Choose the goal that sits at the center of this workspace."
      isOpen={isOpen}
      onRequestClose={onClose}
      title="Select Goal"
    >
      {goals.length > 0 ? (
        <div className="dashboard-goal-select-list">
          {goals.map((goal) => (
            <button
              className={goal.goal.id === selectedGoalId ? "dashboard-goal-select-list__item--active" : ""}
              key={goal.goal.id}
              onClick={() => onSelect(goal.goal.id)}
              type="button"
            >
              <strong>{goal.goal.title}</strong>
              <span>
                {goal.goal.status} - {goal.overallProgress}% progress
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="dashboard-modal__empty">Create a goal first to build a mind map.</p>
      )}
    </ModalShell>
  );
}
