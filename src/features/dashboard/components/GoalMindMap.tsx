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
  OnEdgeUpdateFunc,
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ModalShell } from "@/components/common/ModalShell";
import { Task } from "@/domains/tasks/types";
import { GoalMindMapGoalNode } from "@/features/dashboard/components/GoalMindMapGoalNode";
import { GoalMindMapTaskNode } from "@/features/dashboard/components/GoalMindMapTaskNode";
import { GoalMindMapToolbar } from "@/features/dashboard/components/GoalMindMapToolbar";
import { LinkExistingTaskModal } from "@/features/dashboard/components/LinkExistingTaskModal";
import { CreateMindMapTaskModal } from "@/features/dashboard/components/CreateMindMapTaskModal";
import { TaskModal } from "@/features/tasks/components/AddTaskModal";
import {
  CreateMindMapTaskInput,
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
  wouldCreateCycle,
} from "@/features/dashboard/utils/goalMindMapRules";
import { GoalCardData } from "@/features/goals/hooks/useGoals";
import {
  createRealSubtaskFromMindMap,
  createRealTaskFromMindMap,
  deleteTaskAndDescendants,
  linkSubtaskToParent,
  linkTaskToGoal,
  unlinkSubtaskFromParent,
  unlinkTaskFromMindMap,
  unlinkTaskFromGoal,
  unlinkVisualEdge,
} from "@/features/dashboard/utils/goalMindMapPersistence";

interface GoalMindMapProps {
  goals: GoalCardData[];
  onNavigateToGoals: () => void;
  onSelectGoal: (goalId: string) => void;
  selectedGoalId: string;
  tasks: Task[];
}

const LEGACY_GOAL_NODE_ID = "goal";
const EMPTY_GOAL_NODE_ID = "goal:empty";

interface PendingCreation {
  mode: "task" | "subtask";
  sourceNodeId: string;
}

type SaveStatus = "saved" | "saving" | "unsaved" | "failed";

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
  onNavigateToGoals,
  onSelectGoal,
  selectedGoalId,
  tasks,
}: GoalMindMapProps): JSX.Element {
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGoalSelectOpen, setIsGoalSelectOpen] = useState(false);
  const [connectMode, setConnectMode] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [taskPendingRemoveId, setTaskPendingRemoveId] = useState<string | null>(null);
  const [taskPendingPermanentDeleteId, setTaskPendingPermanentDeleteId] = useState<string | null>(null);
  const [isRemovingTask, setIsRemovingTask] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [pendingCreation, setPendingCreation] = useState<PendingCreation>({
    mode: "task",
    sourceNodeId: EMPTY_GOAL_NODE_ID,
  });
  const [pendingNodePosition, setPendingNodePosition] = useState({ x: 640, y: 260 });
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const fitGoalRef = useRef<string | null>(null);
  const connectionStartRef = useRef<OnConnectStartParams | null>(null);
  const connectionCompletedRef = useRef(false);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const selectedGoal = goals.find((goal) => goal.goal.id === selectedGoalId);
  const goalNodeId = getGoalNodeId(selectedGoalId);
  const linkedTasks = useMemo(
    () => (selectedGoalId ? tasks.filter((task) => task.goalId === selectedGoalId) : []),
    [selectedGoalId, tasks],
  );
  const representedTaskIds = new Set(linkedTasks.map((task) => task.id));
  const linkableTasks = tasks.filter((task) => !representedTaskIds.has(task.id));
  const editingTask = editingTaskId ? tasks.find((task) => task.id === editingTaskId) : undefined;
  const taskPendingRemove = taskPendingRemoveId ? tasks.find((task) => task.id === taskPendingRemoveId) : undefined;
  const taskPendingPermanentDelete = taskPendingPermanentDeleteId
    ? tasks.find((task) => task.id === taskPendingPermanentDeleteId)
    : undefined;
  const todayKey = getDateKey(new Date());

  const [nodes, setNodes] = useNodesState<GoalMindMapNode["data"]>([]);
  const [edges, setEdges] = useEdgesState([]);
  const displayedEdges = useMemo(
    () =>
      edges.map((edge) =>
        edge.id === selectedEdgeId
          ? {
              ...edge,
              animated: true,
              selected: true,
              style: {
                ...edge.style,
                filter: "drop-shadow(0 0 5px rgba(37, 99, 235, 0.55))",
                stroke: "#2563eb",
                strokeWidth: 3,
              },
            }
          : {
              ...edge,
              selected: false,
              style: {
                ...edge.style,
                filter: undefined,
                stroke: undefined,
                strokeWidth: undefined,
              },
            },
      ),
    [edges, selectedEdgeId],
  );

  const validNodeIds = useMemo(() => {
    const ids = new Set([goalNodeId]);
    linkedTasks.forEach((task) => ids.add(getTaskNodeId(task.id)));
    return ids;
  }, [goalNodeId, linkedTasks]);

  const showConnectionMessage = useCallback((message: string): void => {
    setConnectionMessage(message);
    window.setTimeout(() => {
      setConnectionMessage((currentMessage) => (currentMessage === message ? "" : currentMessage));
    }, 2600);
  }, []);

  const persistCurrentLayout = useCallback(
    (nextNodes: GoalMindMapNode[] = nodes, nextEdges: GoalMindMapEdge[] = edges): void => {
      try {
        setSaveStatus("saving");
        const currentLayout = loadGoalMindMapLayout();
        const nodePositions = { ...currentLayout.nodePositions };
        nextNodes.forEach((node) => {
          nodePositions[node.id] = node.position;
        });
        const hierarchyEdges = buildDefaultHierarchyEdges(linkedTasks, goalNodeId);
        saveGoalMindMapLayout({
          selectedGoalId,
          nodePositions,
          manualEdges: getPersistedManualEdges(currentLayout.manualEdges, nextEdges, hierarchyEdges),
          updatedAt: new Date().toISOString(),
        });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("failed");
      }
    },
    [edges, goalNodeId, linkedTasks, nodes, selectedGoalId],
  );

  const schedulePersistCurrentLayout = useCallback(
    (nextNodes: GoalMindMapNode[], nextEdges: GoalMindMapEdge[]): void => {
      setSaveStatus("unsaved");

      if (autosaveTimeoutRef.current !== null) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = window.setTimeout(() => {
        autosaveTimeoutRef.current = null;
        persistCurrentLayout(nextNodes, nextEdges);
      }, 450);
    },
    [persistCurrentLayout],
  );

  const openTaskEditor = useCallback((taskId: string): void => {
    setEditingTaskId(taskId);
  }, []);

  const openTaskRemoveDialog = useCallback((taskId: string): void => {
    setTaskPendingRemoveId(taskId);
  }, []);

  const openGoalSelector = useCallback((): void => {
    setIsGoalSelectOpen(true);
  }, []);

  const refreshMindMap = useCallback((taskSnapshot: Task[] = linkedTasks): void => {
    const layout = loadGoalMindMapLayout();
    const nextNodes = buildNodes({
      goalNodeId,
      linkedTasks: taskSnapshot,
      onEditTask: openTaskEditor,
      onRemoveTask: openTaskRemoveDialog,
      onSelectGoal: openGoalSelector,
      selectedGoal,
      todayKey,
    });
    const positionedNodes = nextNodes.map((node, index) => ({
      ...node,
      position:
        layout.nodePositions[node.id] ??
        (node.id === goalNodeId ? layout.nodePositions[LEGACY_GOAL_NODE_ID] : undefined) ??
        getHierarchicalNodePositions(nextNodes, taskSnapshot, goalNodeId)[node.id] ??
        getDefaultNodePosition(index, nextNodes.length, node.id === goalNodeId),
    }));
    const cleanedEdges = buildEdges({
      goalNodeId,
      manualEdges: layout.manualEdges,
      nodes: positionedNodes,
      tasks: taskSnapshot,
    });

    setNodes(positionedNodes);
    setEdges(cleanedEdges);
    try {
      saveGoalMindMapLayout({
        selectedGoalId,
        nodePositions: {
          ...layout.nodePositions,
          ...Object.fromEntries(positionedNodes.map((node) => [node.id, node.position])),
        },
        manualEdges: getPersistedManualEdges(
          layout.manualEdges,
          cleanedEdges,
          buildDefaultHierarchyEdges(taskSnapshot, goalNodeId),
        ),
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("failed");
    }
  }, [goalNodeId, linkedTasks, openGoalSelector, openTaskEditor, openTaskRemoveDialog, selectedGoal, selectedGoalId, setEdges, setNodes, todayKey]);

  useEffect(() => {
    refreshMindMap();
  }, [refreshMindMap]);

  useEffect(() => {
    function handleMindMapRefresh(): void {
      refreshMindMap();
    }

    window.addEventListener("lifeos:goal-mind-map-refresh", handleMindMapRefresh);
    return () => window.removeEventListener("lifeos:goal-mind-map-refresh", handleMindMapRefresh);
  }, [refreshMindMap]);

  useEffect(() => {
    if (selectedGoalId && fitGoalRef.current !== selectedGoalId && nodes.length > 0) {
      fitGoalRef.current = selectedGoalId;
      window.setTimeout(() => flowRef.current?.fitView({ duration: 250, padding: 0.22 }), 0);
    }
  }, [nodes.length, selectedGoalId]);

  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current !== null) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]): void => {
      const nonDeleteChanges = changes.filter((change) => change.type !== "remove");
      setNodes((currentNodes) => {
        const nextNodes = applyNodeChanges(nonDeleteChanges, currentNodes);
        schedulePersistCurrentLayout(nextNodes, edges);
        return nextNodes;
      });
    },
    [edges, schedulePersistCurrentLayout, setNodes],
  );

  const deleteMindMapEdge = useCallback(
    async (edgeId: string, requireConfirmation = true): Promise<void> => {
      const edge = edges.find((item) => item.id === edgeId);

      if (!edge) {
        setSelectedEdgeId(null);
        return;
      }

      const sourceNode = nodes.find((node) => node.id === edge.source);
      const targetTaskId = getTaskIdFromNodeId(edge.target);
      const isManualEdge = loadGoalMindMapLayout().manualEdges.some((item) => item.id === edge.id);
      let nextTaskSnapshot = linkedTasks;

      try {
        setSaveStatus("saving");

        if (isManualEdge) {
          unlinkVisualEdge(edge.id);
        } else if (sourceNode && isGoalNodeId(sourceNode.id)) {
          if (requireConfirmation && !window.confirm("Remove this task from the goal?")) {
            setSaveStatus("saved");
            return;
          }

          const removedTask = linkedTasks.find((task) => task.id === targetTaskId);
          await unlinkTaskFromGoal(targetTaskId);
          nextTaskSnapshot = removedTask
            ? removeTaskSubtreeFromSnapshot(linkedTasks, removedTask.id)
            : linkedTasks.filter((task) => task.id !== targetTaskId);
        } else if (sourceNode?.data.kind === "task") {
          if (requireConfirmation && !window.confirm("Remove this subtask from its parent?")) {
            setSaveStatus("saved");
            return;
          }

          const updatedTask = await unlinkSubtaskFromParent(targetTaskId);
          if (updatedTask) {
            nextTaskSnapshot = upsertTaskSnapshot(linkedTasks, updatedTask);
          }
        } else {
          unlinkVisualEdge(edge.id);
        }

        const nextEdges = edges.filter((item) => item.id !== edge.id);
        setEdges(nextEdges);
        setSelectedEdgeId(null);
        persistCurrentLayout(nodes, nextEdges);
        refreshMindMap(nextTaskSnapshot);
      } catch {
        setSaveStatus("failed");
      }
    },
    [edges, linkedTasks, nodes, persistCurrentLayout, refreshMindMap, setEdges],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if ((event.key === "Delete" || event.key === "Backspace") && selectedEdgeId) {
        event.preventDefault();
        void deleteMindMapEdge(selectedEdgeId);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        persistCurrentLayout();
        refreshMindMap();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteMindMapEdge, persistCurrentLayout, refreshMindMap, selectedEdgeId]);

  const handleEdgesChangeAsync = useCallback(
    async (changes: EdgeChange[]): Promise<void> => {
      const removeChanges = changes.filter((change) => change.type === "remove");

      for (const change of removeChanges) {
        await deleteMindMapEdge(change.id);
      }

      const nonRemoveChanges = changes.filter((change) => change.type !== "remove");

      if (nonRemoveChanges.length === 0) {
        return;
      }

      setEdges((currentEdges) => {
        const nextEdges = applyEdgeChanges(nonRemoveChanges, currentEdges).filter(
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
    [deleteMindMapEdge, linkedTasks, nodes, persistCurrentLayout, setEdges, validNodeIds],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]): void => {
      void handleEdgesChangeAsync(changes);
    },
    [handleEdgesChangeAsync],
  );

  const handleConnectAsync = useCallback(
    async (connection: Connection): Promise<void> => {
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

      const sourceTaskId = getTaskIdFromNodeId(source);
      const targetTaskId = getTaskIdFromNodeId(target);

      if (sourceNode?.data.kind === "task" && wouldCreateCycle(sourceTaskId, targetTaskId, tasks)) {
        showConnectionMessage("This link would create a circular task chain.");
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

      try {
        setSaveStatus("saving");
        let updatedTask: Task | undefined;
        if (sourceNode && isGoalNodeId(sourceNode.id)) {
          updatedTask = await linkTaskToGoal(targetTaskId, selectedGoalId);
        } else {
          updatedTask = await linkSubtaskToParent(targetTaskId, sourceTaskId, selectedGoalId);
        }
        persistCurrentLayout();
        if (updatedTask) {
          refreshMindMap(upsertTaskSnapshot(linkedTasks, updatedTask));
        }
      } catch {
        setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== getEdgeId(source, target)));
        setSaveStatus("failed");
      }
    },
    [linkedTasks, nodes, persistCurrentLayout, refreshMindMap, selectedGoalId, setEdges, showConnectionMessage, tasks],
  );

  const handleConnect = useCallback(
    (connection: Connection): void => {
      void handleConnectAsync(connection);
    },
    [handleConnectAsync],
  );

  const handleReconnect = useCallback<OnEdgeUpdateFunc>(
    (oldEdge, connection): void => {
      void (async () => {
        if (!connection.source || !connection.target || connection.source === connection.target) {
          showConnectionMessage("This link is not valid.");
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

        const sourceTaskId = getTaskIdFromNodeId(source);
        const targetTaskId = getTaskIdFromNodeId(target);

        if (sourceNode?.data.kind === "task" && wouldCreateCycle(sourceTaskId, targetTaskId, tasks)) {
          showConnectionMessage("This link would create a circular task chain.");
          return;
        }

        const nextEdgeId = getEdgeId(source, target);
        const hasDuplicate = edges.some(
          (edge) => edge.id !== oldEdge.id && edge.source === source && edge.target === target,
        );

        if (hasDuplicate) {
          showConnectionMessage("That link already exists.");
          return;
        }

        try {
          setSaveStatus("saving");
          let updatedTask: Task | undefined;

          if (sourceNode && isGoalNodeId(sourceNode.id)) {
            updatedTask = await linkTaskToGoal(targetTaskId, selectedGoalId);
          } else {
            updatedTask = await linkSubtaskToParent(targetTaskId, sourceTaskId, selectedGoalId);
          }

          const nextEdges = [
            ...edges.filter((edge) => edge.id !== oldEdge.id),
            {
              id: nextEdgeId,
              source,
              target,
              type: "smoothstep",
            },
          ];
          setEdges(nextEdges);
          setSelectedEdgeId(nextEdgeId);
          persistCurrentLayout(nodes, nextEdges);

          if (updatedTask) {
            refreshMindMap(upsertTaskSnapshot(linkedTasks, updatedTask));
          } else {
            refreshMindMap();
          }
        } catch {
          setSaveStatus("failed");
        }
      })();
    },
    [edges, linkedTasks, nodes, persistCurrentLayout, refreshMindMap, selectedGoalId, setEdges, showConnectionMessage, tasks],
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

      if (startParams.nodeId === goalNodeId || startParams.nodeId === LEGACY_GOAL_NODE_ID) {
        setPendingCreation({ mode: "task", sourceNodeId: goalNodeId });
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
    [goalNodeId, screenToFlowPosition, selectedGoalId],
  );

  function fitView(): void {
    flowRef.current?.fitView({ duration: 300, padding: 0.22 });
  }

  function resetLayout(): void {
    const hierarchicalPositions = getHierarchicalNodePositions(nodes, linkedTasks, goalNodeId);
    const nextNodes = nodes.map((node, index) => ({
      ...node,
      position:
        hierarchicalPositions[node.id] ??
        getDefaultNodePosition(index, nodes.length, node.id === goalNodeId),
    }));
    const nextEdges = buildDefaultHierarchyEdges(linkedTasks, goalNodeId);

    setNodes(nextNodes);
    setEdges(nextEdges);
    try {
      setSaveStatus("saving");
      const layout = loadGoalMindMapLayout();
      saveGoalMindMapLayout({
        ...layout,
        selectedGoalId,
        nodePositions: {
          ...layout.nodePositions,
          ...Object.fromEntries(nextNodes.map((node) => [node.id, node.position])),
        },
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus("saved");
      refreshMindMap();
    } catch {
      setSaveStatus("failed");
    }
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

    setPendingCreation({ mode: "task", sourceNodeId: goalNodeId });
    setPendingNodePosition(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    setIsCreateOpen(true);
  }

  async function handleCreateTask(input: CreateMindMapTaskInput): Promise<void> {
    const parentTaskId =
      pendingCreation.mode === "subtask" ? getTaskIdFromNodeId(pendingCreation.sourceNodeId) : undefined;
    const parentTask = parentTaskId ? tasks.find((taskItem) => taskItem.id === parentTaskId) : undefined;
    const task =
      pendingCreation.mode === "subtask" && parentTaskId
        ? await createRealSubtaskFromMindMap({
            ...input,
            goalId: parentTask?.goalId ?? selectedGoalId,
            parentTaskId,
          })
        : selectedGoalId
          ? await createRealTaskFromMindMap({
              ...input,
              goalId: selectedGoalId,
            })
          : undefined;

    if (task) {
      const taskNodeId = getTaskNodeId(task.id);
      const edgeSource = pendingCreation.mode === "subtask" ? pendingCreation.sourceNodeId : goalNodeId;
      const nextEdge = {
        id: getEdgeId(edgeSource, taskNodeId),
        source: edgeSource,
        target: taskNodeId,
        type: "smoothstep",
      };
      const nextEdges = edges.some((edge) => edge.id === nextEdge.id) ? edges : [...edges, nextEdge];
      try {
        setSaveStatus("saving");
        mergeGoalMindMapLayout({
          nodePositions: {
            ...loadGoalMindMapLayout().nodePositions,
            [taskNodeId]: pendingNodePosition,
          },
          manualEdges: getPersistedManualEdges(
            loadGoalMindMapLayout().manualEdges,
            nextEdges,
            buildDefaultHierarchyEdges(linkedTasks, goalNodeId),
          ),
          selectedGoalId,
        });
        setSaveStatus("saved");
        refreshMindMap(upsertTaskSnapshot(linkedTasks, task));
      } catch {
        setSaveStatus("failed");
      }
    }
    setIsCreateOpen(false);
    setPendingCreation({ mode: "task", sourceNodeId: goalNodeId });
  }

  async function handleLinkTasks(taskIds: string[]): Promise<void> {
    if (!selectedGoalId) {
      return;
    }

    await Promise.all(taskIds.map((taskId) => linkTaskToGoal(taskId, selectedGoalId)));
    const linkedTaskSnapshot = tasks
      .filter((task) => taskIds.includes(task.id))
      .reduce<Task[]>(
        (snapshot, task) =>
          upsertTaskSnapshot(snapshot, {
            ...task,
            goalId: selectedGoalId,
            parentTaskId: null,
          }),
        linkedTasks,
      );
    const layout = loadGoalMindMapLayout();
    const nodePositions = { ...layout.nodePositions };
    const nextEdges = [...edges];
    taskIds.forEach((taskId, index) => {
      const task = tasks.find((item) => item.id === taskId);
      const taskNodeId = getTaskNodeId(taskId);
      nodePositions[taskNodeId] = nodePositions[taskNodeId] ?? getDefaultNodePosition(nodes.length + index, nodes.length + taskIds.length, false);
      const sourceNodeId = goalNodeId;
      const edgeId = getEdgeId(sourceNodeId, taskNodeId);
      const sourceNode = nodes.find((node) => node.id === sourceNodeId);
      const targetNode = nodes.find((node) => node.id === taskNodeId) ?? {
        id: taskNodeId,
        type: "taskNode",
        position: nodePositions[taskNodeId],
        data: {
          dueDate: task?.dueDate,
          isOverdue: task ? isTaskOverdue(task, todayKey) : false,
          isSubtask: false,
          kind: "task" as const,
          level: 0,
          onEditTask: openTaskEditor,
          onRemoveTask: openTaskRemoveDialog,
          parentTaskId: undefined,
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
    try {
      setSaveStatus("saving");
      mergeGoalMindMapLayout({
        manualEdges: getPersistedManualEdges(
          layout.manualEdges,
          nextEdges,
          buildDefaultHierarchyEdges(linkedTasks, goalNodeId),
        ),
        nodePositions,
        selectedGoalId,
      });
      setSaveStatus("saved");
      refreshMindMap(linkedTaskSnapshot);
    } catch {
      setSaveStatus("failed");
    }
    setIsLinkOpen(false);
  }

  async function handleUnlinkTaskFromMindMap(): Promise<void> {
    if (!taskPendingRemove) {
      return;
    }

    try {
      setIsRemovingTask(true);
      setSaveStatus("saving");
      await unlinkTaskFromMindMap(taskPendingRemove.id);
      const nextSnapshot = removeTaskSubtreeFromSnapshot(linkedTasks, taskPendingRemove.id);
      persistCurrentLayout();
      refreshMindMap(nextSnapshot);
      setTaskPendingRemoveId(null);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("failed");
    } finally {
      setIsRemovingTask(false);
    }
  }

  async function handleDeleteTaskAndDescendants(): Promise<void> {
    if (!taskPendingPermanentDelete) {
      return;
    }

    try {
      setIsRemovingTask(true);
      setSaveStatus("saving");
      await deleteTaskAndDescendants(taskPendingPermanentDelete.id);
      const nextSnapshot = removeTaskSubtreeFromSnapshot(linkedTasks, taskPendingPermanentDelete.id);
      persistCurrentLayout();
      refreshMindMap(nextSnapshot);
      setTaskPendingPermanentDeleteId(null);
      setTaskPendingRemoveId(null);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("failed");
    } finally {
      setIsRemovingTask(false);
    }
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
          deleteKeyCode={null}
          edges={displayedEdges}
          edgesUpdatable
          edgesFocusable
          elevateEdgesOnSelect
          elementsSelectable
          nodes={nodes}
          nodesConnectable={connectMode}
          nodesDraggable
          nodesFocusable
          nodeTypes={nodeTypes}
          onConnect={connectMode ? handleConnect : undefined}
          onConnectEnd={connectMode ? handleConnectEnd : undefined}
          onConnectStart={connectMode ? handleConnectStart : undefined}
          onEdgeClick={(event, edge) => {
            event.stopPropagation();
            setSelectedEdgeId(edge.id);
          }}
          onEdgesChange={handleEdgesChange}
          onInit={(instance) => {
            flowRef.current = instance;
          }}
          onNodesChange={handleNodesChange}
          onDoubleClick={handlePaneDoubleClick}
          onPaneClick={() => setSelectedEdgeId(null)}
          onReconnect={handleReconnect}
          panOnDrag={[1, 2]}
          proOptions={{ hideAttribution: true }}
          reconnectRadius={18}
        >
          <Background gap={22} size={1} />
          <Controls position="bottom-right" />
          <GoalMindMapToolbar
            canCreateTask={Boolean(selectedGoalId)}
            connectMode={connectMode}
            onAddTask={() => {
              setPendingCreation({ mode: "task", sourceNodeId: goalNodeId });
              setPendingNodePosition({ x: 640, y: 260 });
              setIsCreateOpen(true);
            }}
            onFitView={fitView}
            onLinkExistingTask={() => setIsLinkOpen(true)}
            onResetLayout={resetLayout}
            onSaveLayout={() => {
              persistCurrentLayout();
              refreshMindMap();
            }}
            onSelectGoal={() => setIsGoalSelectOpen(true)}
            onToggleConnectMode={() => setConnectMode((current) => !current)}
            saveStatus={saveStatus}
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
          {selectedEdgeId ? (
            <div className="dashboard-mind-edge-actions nodrag nopan">
              <Button
                onClick={() => {
                  void deleteMindMapEdge(selectedEdgeId);
                }}
                type="button"
                variant="secondary"
              >
                Delete Link
              </Button>
              <Button onClick={() => setSelectedEdgeId(null)} type="button" variant="ghost">
                Cancel
              </Button>
            </div>
          ) : null}
        </ReactFlow>
      </div>
      <GoalSelectorModal
        goals={goals}
        isOpen={isGoalSelectOpen}
        onClose={() => setIsGoalSelectOpen(false)}
        onSelect={(goalId) => {
          onSelectGoal(goalId);
          try {
            setSaveStatus("saving");
            mergeGoalMindMapLayout({ selectedGoalId: goalId });
            setSaveStatus("saved");
          } catch {
            setSaveStatus("failed");
          }
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
        isOpen={isCreateOpen}
        mode={pendingCreation.mode}
        onClose={() => {
          setIsCreateOpen(false);
          setPendingCreation({ mode: "task", sourceNodeId: goalNodeId });
        }}
        onSubmit={(input) => {
          void handleCreateTask(input);
        }}
      />
      <TaskModal
        initialTask={editingTask ?? null}
        isOpen={Boolean(editingTask)}
        mode="edit"
        onClose={() => setEditingTaskId(null)}
        onSaved={(task) => {
          persistCurrentLayout();
          refreshMindMap(
            task.goalId === selectedGoalId
              ? upsertTaskSnapshot(linkedTasks, task)
              : removeTaskSubtreeFromSnapshot(linkedTasks, task.id),
          );
          setEditingTaskId(null);
        }}
      />
      <RemoveTaskFromMindMapDialog
        isBusy={isRemovingTask}
        isOpen={Boolean(taskPendingRemove)}
        onCancel={() => {
          if (!isRemovingTask) {
            setTaskPendingRemoveId(null);
          }
        }}
        onDelete={() => {
          if (taskPendingRemove) {
            setTaskPendingPermanentDeleteId(taskPendingRemove.id);
            setTaskPendingRemoveId(null);
          }
        }}
        onUnlink={() => {
          void handleUnlinkTaskFromMindMap();
        }}
      />
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Delete task and subtasks"
        description="This permanently deletes the task and all subtasks under it. This action cannot be undone."
        isConfirming={isRemovingTask}
        isOpen={Boolean(taskPendingPermanentDelete)}
        onCancel={() => {
          if (!isRemovingTask) {
            setTaskPendingPermanentDeleteId(null);
          }
        }}
        onConfirm={() => {
          void handleDeleteTaskAndDescendants();
        }}
        title="Also delete all subtasks under this task?"
        tone="danger"
      />
    </section>
  );
}

interface BuildNodesInput {
  goalNodeId: string;
  linkedTasks: Task[];
  onEditTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onSelectGoal: () => void;
  selectedGoal?: GoalCardData;
  todayKey: string;
}

function buildNodes({
  goalNodeId,
  linkedTasks,
  onEditTask,
  onRemoveTask,
  onSelectGoal,
  selectedGoal,
  todayKey,
}: BuildNodesInput): GoalMindMapNode[] {
  const goalNode: GoalMindMapNode = {
    id: goalNodeId,
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
      onRemoveTask,
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
  goalNodeId,
  manualEdges,
  nodes,
  tasks,
}: {
  goalNodeId: string;
  manualEdges: Array<{ id: string; source: string; target: string; type?: string }>;
  nodes: GoalMindMapNode[];
  tasks: Task[];
}): GoalMindMapEdge[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const edgesById = new Map<string, GoalMindMapEdge>();

  buildDefaultHierarchyEdges(tasks, goalNodeId).forEach((edge) => {
    if (canConnectMindMapNodes(nodesById.get(edge.source), nodesById.get(edge.target), tasks)) {
      edgesById.set(edge.id, edge);
    }
  });

  manualEdges
    .map((edge) => ({
      ...edge,
      id: getEdgeId(normalizeGoalNodeId(edge.source, goalNodeId), normalizeGoalNodeId(edge.target, goalNodeId)),
      source: normalizeGoalNodeId(edge.source, goalNodeId),
      target: normalizeGoalNodeId(edge.target, goalNodeId),
      type: edge.type ?? "smoothstep",
    }))
    .filter((edge) =>
      canConnectMindMapNodes(nodesById.get(edge.source), nodesById.get(edge.target), tasks),
    )
    .forEach((edge) => {
      if (!edgesById.has(edge.id)) {
        edgesById.set(edge.id, edge);
      }
    });

  return Array.from(edgesById.values());
}

function buildDefaultHierarchyEdges(tasks: Task[], goalNodeId: string): GoalMindMapEdge[] {
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

    const sourceNodeId = task.parentTaskId ? getTaskNodeId(task.parentTaskId) : goalNodeId;
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

function getHierarchicalNodePositions(
  nodes: GoalMindMapNode[],
  tasks: Task[],
  goalNodeId: string,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {
    [goalNodeId]: { x: 360, y: 80 },
  };
  const taskNodes = nodes.filter((node) => node.id !== goalNodeId);
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

function getGoalNodeId(goalId: string): string {
  return goalId ? `goal:${goalId}` : EMPTY_GOAL_NODE_ID;
}

function normalizeGoalNodeId(nodeId: string, goalNodeId: string): string {
  return nodeId === LEGACY_GOAL_NODE_ID || nodeId.startsWith("goal:") ? goalNodeId : nodeId;
}

function isGoalNodeId(nodeId: string): boolean {
  return nodeId === LEGACY_GOAL_NODE_ID || nodeId.startsWith("goal:");
}

function getTaskIdFromNodeId(nodeId: string): string {
  return getTaskIdFromMindMapNodeId(nodeId);
}

function getEdgeId(source: string, target: string): string {
  return `${source}-${target}`;
}

function getPersistedManualEdges(
  currentManualEdges: Array<{ id: string; source: string; target: string; type?: string }>,
  visibleEdges: GoalMindMapEdge[],
  hierarchyEdges: GoalMindMapEdge[],
): Array<{ id: string; source: string; target: string; type?: string }> {
  const visibleEdgeIds = new Set(visibleEdges.map((edge) => edge.id));
  const hierarchyEdgeIds = new Set(hierarchyEdges.map((edge) => edge.id));
  return toStoredEdges(
    currentManualEdges.filter((edge) => visibleEdgeIds.has(edge.id) && !hierarchyEdgeIds.has(edge.id)),
  );
}

function upsertTaskSnapshot(taskSnapshot: Task[], nextTask: Task): Task[] {
  const existingIndex = taskSnapshot.findIndex((task) => task.id === nextTask.id);

  if (existingIndex === -1) {
    return [...taskSnapshot, nextTask];
  }

  return taskSnapshot.map((task) => (task.id === nextTask.id ? nextTask : task));
}

function removeTaskSubtreeFromSnapshot(taskSnapshot: Task[], rootTaskId: string): Task[] {
  const taskIdsToRemove = new Set([rootTaskId]);
  let foundNextDescendant = true;

  while (foundNextDescendant) {
    foundNextDescendant = false;
    taskSnapshot.forEach((task) => {
      if (task.parentTaskId && taskIdsToRemove.has(task.parentTaskId) && !taskIdsToRemove.has(task.id)) {
        taskIdsToRemove.add(task.id);
        foundNextDescendant = true;
      }
    });
  }

  return taskSnapshot.filter((task) => !taskIdsToRemove.has(task.id));
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

function RemoveTaskFromMindMapDialog({
  isBusy,
  isOpen,
  onCancel,
  onDelete,
  onUnlink,
}: {
  isBusy: boolean;
  isOpen: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onUnlink: () => void;
}): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalShell
      description="Choose whether to only remove the task from this goal map or delete the real task."
      isOpen={isOpen}
      onRequestClose={onCancel}
      title="What do you want to remove?"
    >
      <div className="dashboard-remove-task-actions">
        <Button disabled={isBusy} onClick={onUnlink} type="button" variant="secondary">
          Remove from this mind map / unlink from goal
        </Button>
        <Button disabled={isBusy} onClick={onDelete} type="button" variant="danger">
          Delete task permanently
        </Button>
        <Button disabled={isBusy} onClick={onCancel} type="button" variant="ghost">
          Cancel
        </Button>
      </div>
    </ModalShell>
  );
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
