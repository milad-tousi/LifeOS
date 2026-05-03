import { useEffect, useMemo, useState } from "react";
import { CalendarEvent, CalendarHoliday } from "@/domains/calendar/types";
import { getHolidayItemsForMonth } from "@/domains/calendar/holiday.provider";
import { Task } from "@/domains/tasks/types";
import { CalendarContextMenu } from "@/features/tasks/components/CalendarContextMenu";
import { CalendarGrid } from "@/features/tasks/components/CalendarGrid";
import { CalendarHeader } from "@/features/tasks/components/CalendarHeader";
import { EventModal } from "@/features/tasks/components/EventModal";
import { SelectedDayTasksPanel } from "@/features/tasks/components/SelectedDayTasksPanel";
import {
  getCalendarEventOccurrencesForMonth,
  getEventsForCalendarDate,
  getHolidaysForCalendarDate,
  getItemsForDate,
  getMonthGrid,
  getTasksForCalendarDate,
  groupCalendarItemsByDate,
  sortCalendarItems,
  toCalendarDateKey,
} from "@/features/tasks/utils/tasks-calendar-view.utils";

interface TaskCalendarViewProps {
  events: CalendarEvent[];
  goalTitlesById: Record<string, string>;
  onAddTaskFromDate: (date: string) => void;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onEventDeleted: (eventId: string) => void;
  onEventSaved: (event: CalendarEvent) => void;
  onToggleTask: (task: Task) => void;
  tasks: Task[];
}

export function TaskCalendarView({
  events,
  goalTitlesById,
  onAddTaskFromDate,
  onDeleteTask,
  onEditTask,
  onEventDeleted,
  onEventSaved,
  onToggleTask,
  tasks,
}: TaskCalendarViewProps): JSX.Element {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => today);
  const [contextMenu, setContextMenu] = useState<{
    date: string;
    position: { x: number; y: number };
  } | null>(null);
  const [eventDraftDate, setEventDraftDate] = useState<string | null>(null);
  const [eventBeingEdited, setEventBeingEdited] = useState<CalendarEvent | null>(null);
  const holidayRegion = "NL";

  const monthDays = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);
  const holidays = useMemo<CalendarHoliday[]>(
    () => getHolidayItemsForMonth(visibleMonth, holidayRegion),
    [holidayRegion, visibleMonth],
  );
  const eventOccurrences = useMemo(
    () => getCalendarEventOccurrencesForMonth(visibleMonth, events),
    [events, visibleMonth],
  );
  const itemsByDate = useMemo(
    () => groupCalendarItemsByDate(tasks, eventOccurrences, holidays),
    [eventOccurrences, holidays, tasks],
  );
  const selectedDayItems = useMemo(
    () => sortCalendarItems(getItemsForDate(itemsByDate, selectedDate)),
    [itemsByDate, selectedDate],
  );
  const selectedDayTasks = useMemo(
    () => getTasksForCalendarDate(selectedDayItems),
    [selectedDayItems],
  );
  const selectedDayEvents = useMemo(
    () => getEventsForCalendarDate(selectedDayItems),
    [selectedDayItems],
  );
  const selectedDayHolidays = useMemo(
    () => getHolidaysForCalendarDate(selectedDayItems),
    [selectedDayItems],
  );

  useEffect(() => {
    function handleDismiss(): void {
      setContextMenu(null);
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    }

    window.addEventListener("click", handleDismiss);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("click", handleDismiss);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelectDate(date: Date): void {
    setSelectedDate(date);
    setContextMenu(null);

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
    setContextMenu(null);
  }

  function handleGoToToday(): void {
    const nextToday = new Date();
    setVisibleMonth(new Date(nextToday.getFullYear(), nextToday.getMonth(), 1));
    setSelectedDate(nextToday);
    setContextMenu(null);
  }

  function handleOpenContextMenu(date: Date, position: { x: number; y: number }): void {
    setSelectedDate(date);
    setContextMenu({
      date: toCalendarDateKey(date),
      position,
    });
  }

  function handleAddTaskForDate(date: string): void {
    setContextMenu(null);
    onAddTaskFromDate(date);
  }

  function handleAddEventForDate(date: string): void {
    setContextMenu(null);
    setEventDraftDate(date);
    setEventBeingEdited(null);
  }

  return (
    <>
      <div className="task-calendar">
        <CalendarHeader
          monthDate={visibleMonth}
          onGoToToday={handleGoToToday}
          onNextMonth={() => handleChangeMonth(1)}
          onPreviousMonth={() => handleChangeMonth(-1)}
        />

        <CalendarGrid
          days={monthDays}
          itemsByDate={itemsByDate}
          onDayContextMenu={handleOpenContextMenu}
          onSelectDate={handleSelectDate}
          selectedDate={selectedDate}
          today={today}
        />

        <SelectedDayTasksPanel
          allTasks={tasks}
          date={selectedDate}
          events={selectedDayEvents}
          goalTitlesById={goalTitlesById}
          holidays={selectedDayHolidays}
          onAddEvent={() => handleAddEventForDate(toCalendarDateKey(selectedDate))}
          onAddTask={() => handleAddTaskForDate(toCalendarDateKey(selectedDate))}
          onDeleteTask={onDeleteTask}
          onEditEvent={setEventBeingEdited}
          onEditTask={onEditTask}
          onToggleTask={onToggleTask}
          tasks={selectedDayTasks}
        />
      </div>

      <CalendarContextMenu
        isOpen={Boolean(contextMenu)}
        onAddEvent={() => {
          if (contextMenu) {
            handleAddEventForDate(contextMenu.date);
          }
        }}
        onAddTask={() => {
          if (contextMenu) {
            handleAddTaskForDate(contextMenu.date);
          }
        }}
        position={contextMenu?.position ?? null}
      />

      <EventModal
        event={eventBeingEdited}
        initialDate={eventDraftDate ?? undefined}
        isOpen={Boolean(eventDraftDate || eventBeingEdited)}
        onClose={() => {
          setEventDraftDate(null);
          setEventBeingEdited(null);
        }}
        onDeleted={onEventDeleted}
        onSaved={onEventSaved}
      />
    </>
  );
}
