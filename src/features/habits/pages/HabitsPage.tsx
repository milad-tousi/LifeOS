import { useMemo, useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { Habit } from "@/domains/habits/types";
import { CreateHabitModal } from "@/features/habits/components/CreateHabitModal";
import { HabitDetailDrawer } from "@/features/habits/components/HabitDetailDrawer";
import { HabitSettingsModal } from "@/features/habits/components/HabitSettingsModal";
import { HabitStats } from "@/features/habits/components/HabitStats";
import { TodayHabits } from "@/features/habits/components/TodayHabits";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { isHabitActiveOnDate } from "@/features/habits/utils/habit.utils";

export function HabitsPage(): JSX.Element {
  const {
    addHabit,
    addCategory,
    archiveHabitById,
    categories,
    deleteCategoryById,
    deleteHabitLogForDate,
    editHabitById,
    habits,
    logs,
    reminderSettings,
    todayProgress,
    updateCategoryById,
    updateHabitLogForDate,
    updateReminderSettings,
    updateTodayLog,
  } = useHabits();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [habitBeingEdited, setHabitBeingEdited] = useState<Habit | null>(null);
  const [habitBeingViewed, setHabitBeingViewed] = useState<Habit | null>(null);
  const activeHabits = useMemo(
    () => habits.filter((habit) => !habit.archived),
    [habits],
  );
  const todaysHabits = useMemo(
    () => activeHabits.filter((habit) => isHabitActiveOnDate(habit, new Date())),
    [activeHabits],
  );

  return (
    <div className="habits-page">
      <div className="habits-page__header">
        <ScreenHeader
          title="Habits"
          description="Build consistent routines with simple daily tracking."
        />
        <div className="habits-page__actions">
          <Button variant="secondary" onClick={() => setIsSettingsOpen(true)} aria-label="Open habit settings">
            <Settings size={17} />
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={17} />
            New Habit
          </Button>
        </div>
      </div>

      <HabitStats progress={todayProgress} />

      <div className="habits-page__content">
        <TodayHabits
          categories={categories}
          habits={todaysHabits}
          hasAnyHabits={activeHabits.length > 0}
          logs={logs}
          onArchiveHabit={archiveHabitById}
          onCreateHabit={() => setIsCreateModalOpen(true)}
          onEditHabit={setHabitBeingEdited}
          onOpenHabit={setHabitBeingViewed}
          onUpdateLog={updateTodayLog}
        />
      </div>

      <CreateHabitModal
        categories={categories}
        habit={habitBeingEdited}
        isOpen={isCreateModalOpen || habitBeingEdited !== null}
        onAddCategory={addCategory}
        onClose={() => {
          setIsCreateModalOpen(false);
          setHabitBeingEdited(null);
        }}
        onOpenSettings={() => {
          setIsCreateModalOpen(false);
          setHabitBeingEdited(null);
          setIsSettingsOpen(true);
        }}
        onSaveHabit={(input) => {
          if (habitBeingEdited) {
            editHabitById(habitBeingEdited.id, input);
            setHabitBeingEdited(null);
            return;
          }

          addHabit(input);
          setIsCreateModalOpen(false);
        }}
      />

      <HabitSettingsModal
        categories={categories}
        habits={habits}
        isOpen={isSettingsOpen}
        onAddCategory={addCategory}
        onClose={() => setIsSettingsOpen(false)}
        onDeleteCategory={deleteCategoryById}
        onUpdateReminderSettings={updateReminderSettings}
        onUpdateCategory={updateCategoryById}
        reminderSettings={reminderSettings}
      />

      <HabitDetailDrawer
        categories={categories}
        habit={habitBeingViewed}
        isOpen={habitBeingViewed !== null}
        logs={logs}
        onArchiveHabit={(habitId) => {
          archiveHabitById(habitId);
          setHabitBeingViewed(null);
        }}
        onClose={() => setHabitBeingViewed(null)}
        onDeleteLog={deleteHabitLogForDate}
        onEditHabit={(habit) => {
          setHabitBeingViewed(null);
          setHabitBeingEdited(habit);
        }}
        onSaveLog={updateHabitLogForDate}
      />
    </div>
  );
}
