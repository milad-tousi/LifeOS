import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { CreateHabitModal } from "@/features/habits/components/CreateHabitModal";
import { HabitOverview } from "@/features/habits/components/HabitOverview";
import { HabitStats } from "@/features/habits/components/HabitStats";
import { TodayHabits } from "@/features/habits/components/TodayHabits";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { getTodayDateKey } from "@/features/habits/utils/habit.utils";

export function HabitsPage(): JSX.Element {
  const {
    addHabit,
    archiveHabitById,
    habits,
    logs,
    todayProgress,
    updateTodayLog,
  } = useHabits();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const activeHabits = useMemo(
    () => habits.filter((habit) => !habit.archived),
    [habits],
  );
  const todayLogs = useMemo(() => {
    const today = getTodayDateKey();

    return logs.filter((log) => log.date === today);
  }, [logs]);

  return (
    <div className="habits-page">
      <div className="habits-page__header">
        <ScreenHeader
          title="Habits"
          description="Build consistent routines with simple daily tracking."
        />
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={17} />
          New Habit
        </Button>
      </div>

      <HabitStats progress={todayProgress} />

      <div className="habits-page__content">
        <TodayHabits
          habits={activeHabits}
          logs={logs}
          onCreateHabit={() => setIsCreateModalOpen(true)}
          onUpdateLog={updateTodayLog}
        />
        <HabitOverview
          habits={activeHabits}
          logs={todayLogs}
          onArchiveHabit={archiveHabitById}
        />
      </div>

      <CreateHabitModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateHabit={addHabit}
      />
    </div>
  );
}
