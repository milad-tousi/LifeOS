import {
  GoalMindMapLayout,
  GoalMindMapStoredEdge,
} from "@/features/dashboard/types/goalMindMap.types";

export const GOAL_MIND_MAP_STORAGE_KEY = "lifeos:dashboard:goal-mind-map:v1";

const emptyLayout: GoalMindMapLayout = {
  manualEdges: [],
  nodePositions: {},
  selectedGoalId: "",
  updatedAt: undefined,
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

    const parsedValue = JSON.parse(rawValue) as Partial<GoalMindMapLayout> & {
      edges?: GoalMindMapStoredEdge[];
    };
    const storedEdges = Array.isArray(parsedValue.manualEdges)
      ? parsedValue.manualEdges
      : Array.isArray(parsedValue.edges)
        ? parsedValue.edges
        : [];

    return {
      manualEdges: storedEdges.filter(isStoredEdge),
      nodePositions:
        parsedValue.nodePositions && typeof parsedValue.nodePositions === "object"
          ? parsedValue.nodePositions
          : {},
      selectedGoalId:
        typeof parsedValue.selectedGoalId === "string" ? parsedValue.selectedGoalId : "",
      updatedAt:
        typeof parsedValue.updatedAt === "string"
          ? parsedValue.updatedAt
          : typeof parsedValue.updatedAt === "number"
            ? new Date(parsedValue.updatedAt).toISOString()
            : undefined,
    };
  } catch {
    return emptyLayout;
  }
}

export function saveGoalMindMapLayout(layout: GoalMindMapLayout): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    GOAL_MIND_MAP_STORAGE_KEY,
    JSON.stringify({
      ...layout,
      updatedAt: layout.updatedAt ?? new Date().toISOString(),
    }),
  );
}

export function mergeGoalMindMapLayout(patch: Partial<GoalMindMapLayout>): GoalMindMapLayout {
  const nextLayout = {
    ...loadGoalMindMapLayout(),
    ...patch,
    updatedAt: new Date().toISOString(),
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
