import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Task } from "@/domains/tasks/types";
import { TaskListRow } from "@/features/tasks/components/TaskListRow";
import {
  formatSelectedDayLabel,
  formatTaskDateTime,
} from "@/features/tasks/utils/tasks-calendar-view.utils";

interface SelectedDayTasksPanelProps {
  date: Date;
  goalTitlesById: Record<string, string>;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (task: Task) => void;
  tasks: Task[];
}

export function SelectedDayTasksPanel({
  date,
  goalTitlesById,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  tasks,
}: SelectedDayTasksPanelProps): JSX.Element {
  return (
    <section className="task-calendar__panel">
      <div className="task-calendar__panel-header">
        <div>
          <p className="task-calendar__panel-eyebrow">Selected day</p>
          <h3 className="task-calendar__panel-title">{formatSelectedDayLabel(date)}</h3>
        </div>
        <span className="task-calendar__panel-count">
          <CalendarDays size={14} />
          {tasks.length} task{tasks.length === 1 ? "" : "s"}
        </span>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          description="Pick another date or add a due date to plan work here."
          title="No tasks due on this day."
        />
      ) : (
        <div className="task-calendar__panel-list">
          {tasks.map((task) => (
            <div className="task-calendar__panel-item" key={task.id}>
              <div className="task-calendar__panel-meta-line">
                <span className="task-calendar__panel-due">
                  {formatTaskDateTime(task) ?? "No time set"}
                </span>
              </div>
              <TaskListRow
                goalTitle={task.goalId ? goalTitlesById[task.goalId] : undefined}
                isStandalone={!task.goalId}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
                onToggleComplete={onToggleTask}
                task={task}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
