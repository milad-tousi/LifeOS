import { EntityId, TimestampMs } from "@/types/shared.types";
import { TaskStatus } from "@/domains/tasks/types";

export type TaskBoardColumnKind = "default" | "custom";

export interface TaskBoardColumn {
  id: EntityId;
  title: string;
  kind: TaskBoardColumnKind;
  statusKey?: TaskStatus | null;
  order: number;
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}
