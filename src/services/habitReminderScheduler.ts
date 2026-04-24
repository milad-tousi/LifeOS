import { HABIT_SOUNDS, getHabitSoundById } from "@/config/habitSounds";
import { Habit } from "@/domains/habits/types";
import {
  calculateHabitCompletion,
  getHabitLogs,
  getHabits,
  upsertHabitLog,
} from "@/features/habits/services/habits.storage";
import { getHabitReminderSettings } from "@/features/habits/services/habit-reminder-settings.storage";
import { getDateKey, isHabitActiveOnDate } from "@/features/habits/utils/habit.utils";

const CHECK_INTERVAL_MS = 30_000;
const FIRED_STORAGE_KEY = "lifeos:habitReminderFired:v1";
const REMINDER_EVENT_NAME = "lifeos:habit-reminder";
const OPEN_HABIT_DETAIL_EVENT_NAME = "lifeos:open-habit-detail";

interface FiredReminderMap {
  [dateKey: string]: Record<string, true>;
}

interface SnoozeEntry {
  snoozedUntil: number;
}

export interface HabitReminderEventDetail {
  habit: Habit;
  reminderTime: string;
}

let schedulerIntervalId: number | null = null;
let activeAudio: HTMLAudioElement | null = null;
const snoozedReminders = new Map<string, SnoozeEntry>();

function readFiredReminders(): FiredReminderMap {
  if (typeof localStorage === "undefined") {
    return {};
  }

  try {
    const rawValue = localStorage.getItem(FIRED_STORAGE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    return parsedValue && typeof parsedValue === "object" ? (parsedValue as FiredReminderMap) : {};
  } catch {
    return {};
  }
}

function saveFiredReminders(firedReminders: FiredReminderMap): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(FIRED_STORAGE_KEY, JSON.stringify(firedReminders));
}

function hasReminderFiredToday(habitId: string, dateKey: string): boolean {
  return readFiredReminders()[dateKey]?.[habitId] === true;
}

function markReminderFired(habitId: string, dateKey: string): void {
  const firedReminders = readFiredReminders();
  firedReminders[dateKey] = {
    ...(firedReminders[dateKey] ?? {}),
    [habitId]: true,
  };
  saveFiredReminders(firedReminders);
}

function getCurrentTimeKey(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function isHabitCompletedToday(habit: Habit, dateKey: string): boolean {
  const log = getHabitLogs().find((item) => item.habitId === habit.id && item.date === dateKey);

  return calculateHabitCompletion(habit, log);
}

function stopActiveAudio(): void {
  if (!activeAudio) {
    return;
  }

  activeAudio.pause();
  activeAudio.currentTime = 0;
  activeAudio = null;
}

function playReminderSound(): void {
  const settings = getHabitReminderSettings();
  const sound = getHabitSoundById(settings.ringtone);

  stopActiveAudio();

  if (sound.id === "none" || !sound.file) {
    return;
  }

  const audio = new Audio(`/sounds/habits/${sound.file}`);
  audio.volume = settings.volume / 100;
  activeAudio = audio;
  audio.play().catch(() => {
    stopActiveAudio();
  });
}

function vibrateIfEnabled(): void {
  const settings = getHabitReminderSettings();

  if (!settings.vibrate || typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  navigator.vibrate(180);
}

function showBrowserNotification(habit: Habit): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }

  new Notification("Habit Reminder", {
    body: `${habit.title} is scheduled now.`,
    icon: "/favicon.ico",
  });
}

function showInAppReminder(habit: Habit): void {
  window.dispatchEvent(
    new CustomEvent<HabitReminderEventDetail>(REMINDER_EVENT_NAME, {
      detail: {
        habit,
        reminderTime: habit.reminder?.time ?? "",
      },
    }),
  );
}

function triggerReminder(habit: Habit): void {
  showBrowserNotification(habit);
  playReminderSound();
  vibrateIfEnabled();
  showInAppReminder(habit);
}

function checkDueReminders(): void {
  const now = new Date();
  const todayKey = getDateKey(now);
  const currentTime = getCurrentTimeKey(now);
  const habits = getHabits();

  habits.forEach((habit) => {
    if (habit.archived || !habit.reminder?.enabled || !habit.reminder.time) {
      return;
    }

    if (!isHabitActiveOnDate(habit, now)) {
      return;
    }

    if (isHabitCompletedToday(habit, todayKey)) {
      snoozedReminders.delete(habit.id);
      return;
    }

    const snooze = snoozedReminders.get(habit.id);

    if (snooze) {
      if (now.getTime() >= snooze.snoozedUntil) {
        snoozedReminders.delete(habit.id);
        triggerReminder(habit);
      }
      return;
    }

    if (hasReminderFiredToday(habit.id, todayKey)) {
      return;
    }

    if (habit.reminder.time <= currentTime) {
      markReminderFired(habit.id, todayKey);
      triggerReminder(habit);
    }
  });
}

export function getNotificationPermissionStatus(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") {
    return "unsupported";
  }

  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") {
    return "unsupported";
  }

  return Notification.requestPermission();
}

export function startHabitReminderScheduler(): void {
  if (schedulerIntervalId !== null || typeof window === "undefined") {
    return;
  }

  checkDueReminders();
  schedulerIntervalId = window.setInterval(checkDueReminders, CHECK_INTERVAL_MS);
}

export function stopHabitReminderScheduler(): void {
  if (schedulerIntervalId !== null) {
    window.clearInterval(schedulerIntervalId);
    schedulerIntervalId = null;
  }

  snoozedReminders.clear();
  stopActiveAudio();
}

export function rebuildHabitReminderScheduler(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (schedulerIntervalId !== null) {
    window.clearInterval(schedulerIntervalId);
    schedulerIntervalId = null;
  }

  startHabitReminderScheduler();
}

export function snoozeHabitReminder(habitId: string, minutes: number): void {
  snoozedReminders.set(habitId, {
    snoozedUntil: Date.now() + minutes * 60_000,
  });
  stopActiveAudio();
}

export function dismissHabitReminder(habitId: string): void {
  snoozedReminders.delete(habitId);
  markReminderFired(habitId, getDateKey(new Date()));
  stopActiveAudio();
}

export function completeHabitReminder(habit: Habit): void {
  if (habit.type === "binary") {
    upsertHabitLog(habit.id, getDateKey(new Date()), 1);
    dismissHabitReminder(habit.id);
    rebuildHabitReminderScheduler();
    return;
  }

  window.dispatchEvent(
    new CustomEvent<{ habitId: string }>(OPEN_HABIT_DETAIL_EVENT_NAME, {
      detail: { habitId: habit.id },
    }),
  );
  dismissHabitReminder(habit.id);
}

export function triggerTestHabitReminder(): void {
  const testHabit: Habit = {
    archived: false,
    createdAt: new Date().toISOString(),
    frequency: "daily",
    id: "habit-reminder-test",
    reminder: {
      enabled: true,
      time: getCurrentTimeKey(new Date()),
    },
    startDate: getDateKey(new Date()),
    target: 1,
    title: "Test reminder",
    type: "binary",
    updatedAt: new Date().toISOString(),
  };

  triggerReminder(testHabit);
}

export { HABIT_SOUNDS, REMINDER_EVENT_NAME, OPEN_HABIT_DETAIL_EVENT_NAME };
