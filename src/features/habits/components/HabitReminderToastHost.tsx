import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/common/Button";
import { Habit } from "@/domains/habits/types";
import { getHabitReminderSettings } from "@/features/habits/services/habit-reminder-settings.storage";
import {
  completeHabitReminder,
  HabitReminderEventDetail,
  REMINDER_EVENT_NAME,
  snoozeHabitReminder,
} from "@/services/habitReminderScheduler";

interface ActiveReminder {
  habit: Habit;
  reminderTime: string;
}

export function HabitReminderToastHost(): JSX.Element | null {
  const [reminderQueue, setReminderQueue] = useState<ActiveReminder[]>([]);

  useEffect(() => {
    function handleReminder(event: Event): void {
      const reminderEvent = event as CustomEvent<HabitReminderEventDetail>;
      setReminderQueue((currentQueue) => [
        ...currentQueue,
        {
          habit: reminderEvent.detail.habit,
          reminderTime: reminderEvent.detail.reminderTime,
        },
      ]);
    }

    window.addEventListener(REMINDER_EVENT_NAME, handleReminder);
    return () => {
      window.removeEventListener(REMINDER_EVENT_NAME, handleReminder);
    };
  }, []);

  const activeReminder = reminderQueue[0] ?? null;
  const snoozeMinutes = getHabitReminderSettings().snoozeMinutes;

  if (!activeReminder) {
    return null;
  }

  function showNextReminder(): void {
    setReminderQueue((currentQueue) => currentQueue.slice(1));
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="habit-reminder-popup-backdrop" role="presentation">
      <aside className="habit-reminder-popup" role="dialog" aria-modal="true" aria-label="Habit reminder">
        <p className="habit-reminder-popup__eyebrow">Habit Reminder</p>
        <h3>{activeReminder.habit.title}</h3>
        <span className="habit-reminder-popup__time">
          {activeReminder.reminderTime || "Due now"}
        </span>
        <p>This habit is scheduled now.</p>

        <div className="habit-reminder-popup__actions">
          <Button
            className="habit-reminder-popup__done"
            type="button"
            onClick={() => {
              completeHabitReminder(activeReminder.habit);
              showNextReminder();
            }}
          >
            Done
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              snoozeHabitReminder(activeReminder.habit.id, snoozeMinutes);
              showNextReminder();
            }}
          >
            Snooze {snoozeMinutes}m
          </Button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
