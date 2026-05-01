import {
  GoalMindMapLayout,
  GoalMindMapStoredEdge,
} from "@/features/dashboard/types/goalMindMap.types";

export const GOAL_MIND_MAP_STORAGE_KEY = "lifeos:dashboard:goal-mind-map:v1";

const emptyLayout: GoalMindMapLayout = {
  edges: [],
  nodePositions: {},
  selectedGoalId: "",
};

export function loadGoalMindMapLayout(): GoalMindMapLayout {
  if (typeof window === "undefined") {
    return emptyLayout;
  }

  try {
    const rawValue = window.localStorage.getItem(GOAL_MIND_MAP_STORAGE_KEY);
    if (!rawValue) {
      return emptyLayout;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<GoalMindMapLayout>;

    return {
      edges: Array.isArray(parsedValue.edges)
        ? parsedValue.edges.filter(isStoredEdge)
        : [],
      nodePositions:
        parsedValue.nodePositions && typeof parsedValue.nodePositions === "object"
          ? parsedValue.nodePositions
          : {},
      selectedGoalId:
        typeof parsedValue.selectedGoalId === "string" ? parsedValue.selectedGoalId : "",
    };
  } catch {
    return emptyLayout;
  }
}

export function saveGoalMindMapLayout(layout: GoalMindMapLayout): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(GOAL_MIND_MAP_STORAGE_KEY, JSON.stringify(layout));
}

export function mergeGoalMindMapLayout(patch: Partial<GoalMindMapLayout>): GoalMindMapLayout {
  const nextLayout = {
    ...loadGoalMindMapLayout(),
    ...patch,
  };
  saveGoalMindMapLayout(nextLayout);
  return nextLayout;
}

export function toStoredEdges(edges: Array<{ id: string; source: string; target: string; type?: string }>): GoalMindMapStoredEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
  }));
}

function isStoredEdge(value: unknown): value is GoalMindMapStoredEdge {
  if (!value || typeof value !== "object") {
    return false;
  }

  const edge = value as Partial<GoalMindMapStoredEdge>;
  return typeof edge.id === "string" && typeof edge.source === "string" && typeof edge.target === "string";
}
