import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Habit } from "@/domains/habits/types";
import {
  completeHabitReminder,
  dismissHabitReminder,
  HabitReminderEventDetail,
  REMINDER_EVENT_NAME,
  snoozeHabitReminder,
} from "@/services/habitReminderScheduler";

interface ActiveReminder {
  habit: Habit;
  reminderTime: string;
}

export function HabitReminderToastHost(): JSX.Element | null {
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);

  useEffect(() => {
    function handleReminder(event: Event): void {
      const reminderEvent = event as CustomEvent<HabitReminderEventDetail>;
      setActiveReminder({
        habit: reminderEvent.detail.habit,
        reminderTime: reminderEvent.detail.reminderTime,
      });
    }

    window.addEventListener(REMINDER_EVENT_NAME, handleReminder);
    return () => {
      window.removeEventListener(REMINDER_EVENT_NAME, handleReminder);
    };
  }, []);

  if (!activeReminder) {
    return null;
  }

  function closeToast(): void {
    setActiveReminder(null);
  }

  return (
    <aside className="habit-reminder-toast" role="dialog" aria-label="Habit reminder">
      <div>
        <p className="habit-reminder-toast__eyebrow">Habit Reminder</p>
        <h3>{activeReminder.habit.title}</h3>
        <p>{activeReminder.reminderTime || "Scheduled now"}</p>
      </div>
      <div className="habit-reminder-toast__actions">
        <Button
          type="button"
          onClick={() => {
            completeHabitReminder(activeReminder.habit);
            closeToast();
          }}
        >
          Done
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            snoozeHabitReminder(activeReminder.habit.id, 10);
            closeToast();
          }}
        >
          Snooze 10m
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            snoozeHabitReminder(activeReminder.habit.id, 30);
            closeToast();
          }}
        >
          Snooze 30m
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            dismissHabitReminder(activeReminder.habit.id);
            closeToast();
          }}
        >
          Dismiss
        </Button>
      </div>
    </aside>
  );
}
