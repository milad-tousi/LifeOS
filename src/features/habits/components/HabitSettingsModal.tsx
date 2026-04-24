import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import { ModalShell } from "@/components/common/ModalShell";
import { getHabitSoundById, HABIT_SOUNDS } from "@/config/habitSounds";
import { Habit } from "@/domains/habits/types";
import { HabitCategory } from "@/features/habits/services/habit-categories.storage";
import { HabitReminderSettings } from "@/features/habits/services/habit-reminder-settings.storage";
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  triggerTestHabitReminder,
} from "@/services/habitReminderScheduler";

interface HabitSettingsModalProps {
  categories: HabitCategory[];
  habits: Habit[];
  isOpen: boolean;
  onAddCategory: (input: { name: string }) => HabitCategory;
  onClose: () => void;
  onDeleteCategory: (id: string) => void;
  onUpdateReminderSettings: (patch: Partial<HabitReminderSettings>) => void;
  onUpdateCategory: (id: string, patch: Partial<Pick<HabitCategory, "name" | "color">>) => void;
  reminderSettings: HabitReminderSettings;
}

function isCategoryUsed(category: HabitCategory, habits: Habit[]): boolean {
  return habits.some((habit) => habit.category === category.id || habit.category === category.name);
}

export function HabitSettingsModal({
  categories,
  habits,
  isOpen,
  onAddCategory,
  onClose,
  onDeleteCategory,
  onUpdateReminderSettings,
  onUpdateCategory,
  reminderSettings,
}: HabitSettingsModalProps): JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [draftCategoryName, setDraftCategoryName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [soundMessage, setSoundMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(() =>
    getNotificationPermissionStatus(),
  );
  const [lastRefreshAt, setLastRefreshAt] = useState(() => new Date());

  function stopSound(): void {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setIsPlaying(false);
  }

  useEffect(() => {
    stopSound();
  }, [reminderSettings.ringtone]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = reminderSettings.volume / 100;
    }
  }, [reminderSettings.volume]);

  useEffect(() => {
    if (!isOpen) {
      stopSound();
      return;
    }

    setPermissionStatus(getNotificationPermissionStatus());
    setLastRefreshAt(new Date());
  }, [isOpen]);

  useEffect(() => stopSound, []);

  function handleAddCategory(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const name = draftCategoryName.trim();

    if (!name) {
      setMessage("Category name is required.");
      return;
    }

    onAddCategory({ name });
    setDraftCategoryName("");
    setMessage(null);
  }

  function handleDeleteCategory(category: HabitCategory): void {
    if (isCategoryUsed(category, habits)) {
      setMessage("This category is used by existing habits.");
      return;
    }

    onDeleteCategory(category.id);
    setMessage(null);
  }

  async function handleEnableNotifications(): Promise<void> {
    const nextStatus = await requestNotificationPermission();
    setPermissionStatus(nextStatus);
  }

  function handleSoundToggle(): void {
    if (isPlaying) {
      stopSound();
      return;
    }

    if (reminderSettings.ringtone === "none") {
      setSoundMessage("No sound selected.");
      return;
    }

    const sound = getHabitSoundById(reminderSettings.ringtone);

    if (!sound.file) {
      setSoundMessage("No sound selected.");
      return;
    }

    stopSound();

    const audio = new Audio(`/sounds/habits/${sound.file}`);
    audio.volume = reminderSettings.volume / 100;
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      audioRef.current = null;
    });
    audioRef.current = audio;

    audio.play().then(
      () => {
        setIsPlaying(true);
        setSoundMessage(null);
      },
      () => {
        stopSound();
        setSoundMessage("Unable to play this sound file.");
      },
    );
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onRequestClose={onClose}
      title="Habit Settings"
      description="Manage habit categories used across your routines."
      size="wide"
    >
      <section className="habit-settings">
        <section className="habit-settings__section">
          <header className="habit-settings__header">
            <h3>Reminder Sound</h3>
            <p>Choose the sound profile future habit reminders will use.</p>
          </header>

          <div className="habit-settings__permission">
            <span className={`habit-settings__permission-badge habit-settings__permission-badge--${permissionStatus}`}>
              {permissionStatus === "granted"
                ? "Granted"
                : permissionStatus === "denied"
                  ? "Denied"
                  : "Not Enabled"}
            </span>
            {permissionStatus !== "granted" ? (
              <p>Browser notifications are required for reminders.</p>
            ) : null}
            {permissionStatus !== "granted" && permissionStatus !== "unsupported" ? (
              <Button type="button" variant="secondary" onClick={() => void handleEnableNotifications()}>
                Enable Notifications
              </Button>
            ) : null}
          </div>

          <div className="habit-settings__sound-grid">
            <label className="habit-settings__field">
              <span>Ringtone</span>
              <select
                value={reminderSettings.ringtone}
                onChange={(event) =>
                  onUpdateReminderSettings({ ringtone: event.target.value })
                }
              >
                {HABIT_SOUNDS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="habit-settings__field">
              <span>Volume: {reminderSettings.volume}</span>
              <input
                min={0}
                max={100}
                type="range"
                value={reminderSettings.volume}
                onChange={(event) =>
                  onUpdateReminderSettings({ volume: Number(event.target.value) })
                }
              />
            </label>

            <label className="habit-settings__toggle">
              <input
                checked={reminderSettings.vibrate}
                type="checkbox"
                onChange={(event) =>
                  onUpdateReminderSettings({ vibrate: event.target.checked })
                }
              />
              <span>Vibrate</span>
            </label>
          </div>

          <div className="habit-settings__preview">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSoundToggle}
              disabled={reminderSettings.ringtone === "none"}
            >
              {isPlaying ? "Stop" : "Play"}
            </Button>
            <p>
              {soundMessage ?? "Play the selected reminder sound before saving your settings."}
            </p>
          </div>

          <div className="habit-settings__preview">
            <Button type="button" variant="secondary" onClick={triggerTestHabitReminder}>
              Test Reminder
            </Button>
            <p>Last scheduler refresh: {lastRefreshAt.toLocaleTimeString()}</p>
          </div>
        </section>

        <section className="habit-settings__section">
          <header className="habit-settings__header">
            <h3>Category management</h3>
            <p>Rename, add, or remove the categories available in habit forms.</p>
          </header>

          <form className="habit-settings__add" onSubmit={handleAddCategory}>
            <input
              value={draftCategoryName}
              onChange={(event) => setDraftCategoryName(event.target.value)}
              placeholder="New category"
            />
            <Button type="submit">Add Category</Button>
          </form>

          <div className="habit-settings__list">
            {categories.map((category) => (
              <article className="habit-settings__row" key={category.id}>
                <span className="habit-category-swatch" style={{ background: category.color }} />
                <input
                  value={category.name}
                  onChange={(event) =>
                    onUpdateCategory(category.id, { name: event.target.value })
                  }
                  aria-label={`Rename ${category.name}`}
                />
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => handleDeleteCategory(category)}
                >
                  Delete
                </Button>
              </article>
            ))}
          </div>

          {message ? <p className="habit-settings__message">{message}</p> : null}
        </section>
      </section>
    </ModalShell>
  );
}
