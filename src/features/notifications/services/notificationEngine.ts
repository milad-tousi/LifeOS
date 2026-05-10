import { db, ensureDatabaseReady } from "@/db/dexie";
import { calendarEventsRepository } from "@/domains/calendar/repository";
import { CalendarEvent, EventReminder } from "@/domains/calendar/types";
import { goalsRepository } from "@/domains/goals/repository";
import { tasksRepository } from "@/domains/tasks/repository";
import { getHabitLogs, getHabits } from "@/features/habits/services/habits.storage";
import { getTodayDateKey, isHabitActiveOnDate } from "@/features/habits/utils/habit.utils";
import { financeStorage } from "@/features/finance/services/finance.storage";
import { buildDedupKey, NotificationType } from "@/features/notifications/types";
import { notificationStore } from "@/features/notifications/services/notificationStore";
import type { RecurringTransaction } from "@/features/finance/types/finance.types";

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function isBeforeToday(dateStr: string): boolean {
  return dateStr < todayKey();
}

/** Compute next occurrence of a recurring transaction on or after today */
function getNextOccurrenceDates(rt: RecurringTransaction): string[] {
  const today = todayKey();
  const tomorrow = tomorrowKey();
  const start = rt.startDate;
  if (!start) return [];

  // Simple approach: check today and tomorrow against the recurrence pattern
  const results: string[] = [];
  for (const target of [today, tomorrow]) {
    if (matchesRecurrence(rt, target)) {
      results.push(target);
    }
  }
  return results;
}

function matchesRecurrence(rt: RecurringTransaction, target: string): boolean {
  if (rt.endDate && target > rt.endDate) return false;
  if (target < rt.startDate) return false;

  const start = new Date(`${rt.startDate}T12:00:00`);
  const check = new Date(`${target}T12:00:00`);

  const diffMs = check.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return false;

  switch (rt.repeat) {
    case "daily":
      return true;
    case "weekly":
      return diffDays % 7 === 0;
    case "monthly": {
      return (
        start.getDate() === check.getDate() ||
        // Handle month-end: e.g. 31st falls on 28/29/30
        (start.getDate() > check.getDate() &&
          new Date(check.getFullYear(), check.getMonth() + 1, 0).getDate() === check.getDate())
      );
    }
    case "yearly":
      return start.getDate() === check.getDate() && start.getMonth() === check.getMonth();
    default:
      return false;
  }
}

// ── Rule runners ──────────────────────────────────────────────────────────────

async function runTaskRules(t: (key: string, v?: Record<string, string | number>) => string): Promise<void> {
  const tasks = await tasksRepository.getAll();
  const today = todayKey();

  for (const task of tasks) {
    if (task.status === "done" || task.status === "cancelled") {
      // Auto-dismiss any existing overdue notification
      const key = buildDedupKey("task_overdue", task.id, task.dueDate ?? "");
      await notificationStore.dismissByDedupKey(key);
      continue;
    }

    if (!task.dueDate || task.dueDate >= today) continue;

    const dedupKey = buildDedupKey("task_overdue", task.id, task.dueDate);
    await notificationStore.upsert({
      type: "task_overdue",
      title: t("notifications.type.taskOverdue"),
      message: `${task.title} — ${t("notifications.dueOn")} ${task.dueDate}`,
      entityType: "task",
      entityId: task.id,
      severity: "critical",
      scheduledAt: task.dueDate,
      actionUrl: "/tasks",
      dedupKey,
      metadata: { taskTitle: task.title, dueDate: task.dueDate },
    });
  }
}

async function runGoalRules(t: (key: string, v?: Record<string, string | number>) => string): Promise<void> {
  const goals = await goalsRepository.getAll();
  const today = todayKey();

  for (const goal of goals) {
    if (goal.status === "completed" || goal.status === "archived") {
      const key = buildDedupKey("goal_overdue", goal.id, goal.deadline ?? "");
      await notificationStore.dismissByDedupKey(key);
      continue;
    }

    if (!goal.deadline || goal.deadline >= today) continue;

    const dedupKey = buildDedupKey("goal_overdue", goal.id, goal.deadline);
    await notificationStore.upsert({
      type: "goal_overdue",
      title: t("notifications.type.goalOverdue"),
      message: `${goal.title} — ${t("notifications.deadlineWas")} ${goal.deadline}`,
      entityType: "goal",
      entityId: goal.id,
      severity: "warning",
      scheduledAt: goal.deadline,
      actionUrl: `/goals/${goal.id}`,
      dedupKey,
      metadata: { goalTitle: goal.title, deadline: goal.deadline },
    });
  }
}

/**
 * Calculate the absolute timestamp (ms) when the reminder should fire.
 * Returns null if reminder is disabled or event has no valid start.
 */
function calcReminderFireMs(event: CalendarEvent): number | null {
  const reminder: EventReminder | null | undefined = event.reminder;
  if (!reminder?.enabled) return null;

  const startDateStr = event.startDate;
  if (!startDateStr) return null;

  // For all-day events with "at_time", treat as midnight of the start day
  const startTimeStr =
    event.isAllDay || !event.startTime ? "00:00" : event.startTime;

  const eventStartMs = new Date(`${startDateStr}T${startTimeStr}:00`).getTime();
  if (Number.isNaN(eventStartMs)) return null;

  if (reminder.mode === "at_time" || !reminder.amount || !reminder.unit) {
    return eventStartMs;
  }

  const unitMs: Record<string, number> = {
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
  };
  const offsetMs = reminder.amount * (unitMs[reminder.unit] ?? 60000);
  return eventStartMs - offsetMs;
}

async function runEventRules(t: (key: string, v?: Record<string, string | number>) => string): Promise<void> {
  const events = await calendarEventsRepository.getAll();
  const today = todayKey();
  const tomorrow = tomorrowKey();
  const nowMs = Date.now();

  for (const event of events) {
    const startDate = event.startDate;
    if (!startDate) continue;

    // ── Reminder-based notifications ─────────────────────────────────────
    if (event.reminder?.enabled) {
      const fireMs = calcReminderFireMs(event);
      if (fireMs !== null && nowMs >= fireMs) {
        // Don't fire if the event has already fully ended
        const eventEndDate = event.endDate ?? event.startDate;
        if (eventEndDate >= today) {
          // Stable dedup key includes minute-precision of reminder fire time
          const fireKey = new Date(fireMs).toISOString().substring(0, 16);
          const dedupKey = buildDedupKey("event_reminder", event.id, `r:${fireKey}`);
          const timeLabel = event.startTime ? ` ${t("notifications.at")} ${event.startTime}` : "";
          await notificationStore.upsert({
            type: "event_reminder",
            title: t("notifications.type.eventReminder"),
            message: `${event.title}${timeLabel}`,
            entityType: "event",
            entityId: event.id,
            severity: "info",
            scheduledAt: new Date(fireMs).toISOString().split("T")[0],
            actionUrl: "/tasks",
            dedupKey,
            metadata: { eventTitle: event.title, startTime: event.startTime, reminderFireMs: fireMs },
          });
        }
      }
      // When reminder is explicitly set, skip the fallback today/tomorrow logic
      continue;
    }

    // ── Fallback: no reminder configured — notify on day-of and day-before ──

    // Today reminder (reminder is null/disabled for this event)
    if (startDate === today) {
      const dedupKey = buildDedupKey("event_reminder", event.id, today);
      const timeLabel = event.startTime ? ` ${t("notifications.at")} ${event.startTime}` : "";
      await notificationStore.upsert({
        type: "event_reminder",
        title: t("notifications.type.eventReminder"),
        message: `${event.title}${timeLabel}`,
        entityType: "event",
        entityId: event.id,
        severity: "info",
        scheduledAt: startDate,
        actionUrl: "/tasks",
        dedupKey,
        metadata: { eventTitle: event.title, startTime: event.startTime },
      });
    }

    // Tomorrow reminder
    if (startDate === tomorrow) {
      const dedupKey = buildDedupKey("event_reminder", event.id, `upcoming:${tomorrow}`);
      await notificationStore.upsert({
        type: "event_reminder",
        title: t("notifications.type.upcomingEvent"),
        message: `${event.title} — ${t("notifications.tomorrow")}`,
        entityType: "event",
        entityId: event.id,
        severity: "info",
        scheduledAt: startDate,
        actionUrl: "/tasks",
        dedupKey,
        metadata: { eventTitle: event.title },
      });
    }
  }
}

async function runPaymentRules(t: (key: string, v?: Record<string, string | number>) => string): Promise<void> {
  const recurring = financeStorage.getRecurringTransactions();
  const today = todayKey();
  const tomorrow = tomorrowKey();

  for (const rt of recurring) {
    if (!rt.isActive || rt.type !== "expense") continue;

    const occurrences = getNextOccurrenceDates(rt);

    for (const date of occurrences) {
      const isToday = date === today;
      const title = isToday
        ? t("notifications.type.paymentDueToday")
        : t("notifications.type.paymentDueTomorrow");

      const dedupKey = buildDedupKey("payment_due", rt.id, date);
      await notificationStore.upsert({
        type: "payment_due",
        title,
        message: rt.merchant ?? rt.note ?? t("notifications.recurringPayment"),
        entityType: "finance",
        entityId: rt.id,
        severity: isToday ? "critical" : "warning",
        scheduledAt: date,
        actionUrl: "/finance",
        dedupKey,
        metadata: { merchant: rt.merchant, amount: rt.amount },
      });
    }
  }
}

async function runHabitRules(t: (key: string, v?: Record<string, string | number>) => string): Promise<void> {
  const today = new Date();
  const todayStr = todayKey();
  const habits = getHabits();
  const logs = getHabitLogs();

  for (const habit of habits) {
    if (habit.archived) continue;
    if (!habit.reminder?.enabled || !habit.reminder.time) continue;
    if (!isHabitActiveOnDate(habit, today)) continue;

    // Check if already completed today
    const completedToday = logs.some(
      (log) => log.habitId === habit.id && log.date === todayStr && log.completed,
    );

    if (completedToday) {
      const key = buildDedupKey("habit_reminder", habit.id, todayStr);
      await notificationStore.dismissByDedupKey(key);
      continue;
    }

    const dedupKey = buildDedupKey("habit_reminder", habit.id, todayStr);
    await notificationStore.upsert({
      type: "habit_reminder",
      title: t("notifications.type.habitReminder"),
      message: `${habit.title} — ${t("notifications.at")} ${habit.reminder.time}`,
      entityType: "habit",
      entityId: habit.id,
      severity: "info",
      scheduledAt: todayStr,
      actionUrl: "/habits",
      dedupKey,
      metadata: { habitTitle: habit.title, reminderTime: habit.reminder.time },
    });
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function runNotificationEngine(
  t: (key: string, v?: Record<string, string | number>) => string,
): Promise<void> {
  try {
    await Promise.all([
      runTaskRules(t),
      runGoalRules(t),
      runEventRules(t),
      runPaymentRules(t),
      runHabitRules(t),
    ]);
    await notificationStore.pruneOldDismissed(14);
  } catch (err) {
    // Engine failure must never crash the app
    if (process.env.NODE_ENV !== "production") {
      console.warn("[NotificationEngine] error:", err);
    }
  }
}
