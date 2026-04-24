import { HABIT_SOUNDS } from "@/config/habitSounds";

const HABIT_REMINDER_SETTINGS_STORAGE_KEY = "lifeos:habitReminderSettings:v1";

export interface HabitReminderSettings {
  ringtone: string;
  volume: number;
  vibrate: boolean;
}

export const defaultHabitReminderSettings: HabitReminderSettings = {
  ringtone: "calm-elegant",
  volume: 70,
  vibrate: true,
};

function normalizeHabitReminderSettings(value: Partial<HabitReminderSettings>): HabitReminderSettings {
  const ringtone = value.ringtone === "soft-bell" ? "calm-elegant" : value.ringtone;
  const safeRingtone = HABIT_SOUNDS.some((sound) => sound.id === ringtone)
    ? ringtone
    : defaultHabitReminderSettings.ringtone;

  return {
    ringtone: safeRingtone,
    volume: Math.min(100, Math.max(0, value.volume ?? defaultHabitReminderSettings.volume)),
    vibrate: value.vibrate ?? defaultHabitReminderSettings.vibrate,
  };
}

export function getHabitReminderSettings(): HabitReminderSettings {
  if (typeof localStorage === "undefined") {
    return defaultHabitReminderSettings;
  }

  try {
    const rawValue = localStorage.getItem(HABIT_REMINDER_SETTINGS_STORAGE_KEY);

    if (!rawValue) {
      saveHabitReminderSettings(defaultHabitReminderSettings);
      return defaultHabitReminderSettings;
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return defaultHabitReminderSettings;
    }

    return normalizeHabitReminderSettings(parsedValue);
  } catch {
    return defaultHabitReminderSettings;
  }
}

export function saveHabitReminderSettings(settings: HabitReminderSettings): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(
    HABIT_REMINDER_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeHabitReminderSettings(settings)),
  );
}

export function updateHabitReminderSettings(
  patch: Partial<HabitReminderSettings>,
): HabitReminderSettings {
  const settings = normalizeHabitReminderSettings({
    ...getHabitReminderSettings(),
    ...patch,
  });

  saveHabitReminderSettings(settings);

  return settings;
}
