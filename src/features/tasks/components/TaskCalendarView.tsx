import { useMemo, useState } from "react";
import { Task } from "@/domains/tasks/types";
import { CalendarGrid } from "@/features/tasks/components/CalendarGrid";
import { CalendarHeader } from "@/features/tasks/components/CalendarHeader";
import { SelectedDayTasksPanel } from "@/features/tasks/components/SelectedDayTasksPanel";
import {
  getMonthGrid,
  getTasksForCalendarDate,
  groupTasksByDate,
  sortCalendarTasks,
} from "@/features/tasks/utils/tasks-calendar-view.utils";

interface TaskCalendarViewProps {
  goalTitlesById: Record<string, string>;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (task: Task) => void;
  tasks: Task[];
}

export function TaskCalendarView({
  goalTitlesById,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  tasks,
}: TaskCalendarViewProps): JSX.Element {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => today);

  const monthDays = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const selectedDayTasks = useMemo(
    () => sortCalendarTasks(getTasksForCalendarDate(tasksByDate, selectedDate)),
    [selectedDate, tasksByDate],
  );

  function handleSelectDate(date: Date): void {
    setSelectedDate(date);

    if (
      date.getMonth() !== visibleMonth.getMonth() ||
      date.getFullYear() !== visibleMonth.getFullYear()
    ) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  function handleChangeMonth(offset: number): void {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(nextMonth);
  }

  function handleGoToToday(): void {
    const nextToday = new Date();
    setVisibleMonth(new Date(nextToday.getFullYear(), nextToday.getMonth(), 1));
    setSelectedDate(nextToday);
  }

  return (
    <div className="task-calendar">
      <CalendarHeader
        monthDate={visibleMonth}
        onGoToToday={handleGoToToday}
        onNextMonth={() => handleChangeMonth(1)}
        onPreviousMonth={() => handleChangeMonth(-1)}
      />

      <CalendarGrid
        days={monthDays}
        onSelectDate={handleSelectDate}
        selectedDate={selectedDate}
        tasksByDate={tasksByDate}
        today={today}
      />

      <SelectedDayTasksPanel
        date={selectedDate}
        goalTitlesById={goalTitlesById}
        onDeleteTask={onDeleteTask}
        onEditTask={onEditTask}
        onToggleTask={onToggleTask}
        tasks={selectedDayTasks}
      />
    </div>
  );
}
