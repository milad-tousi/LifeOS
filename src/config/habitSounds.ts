export interface HabitSound {
  id: string;
  label: string;
  file: string;
}

export const HABIT_SOUNDS: HabitSound[] = [
  {
    id: "calm-elegant",
    label: "Calm Elegant",
    file: "alexzavesa-calm-elegant-logo-519008.mp3",
  },
  {
    id: "morning-chime",
    label: "Morning Chime",
    file: "alexzavesa-calm-inspiring-technology-logo-short-version-518993.mp3",
  },
  {
    id: "relaxing-guitar",
    label: "Relaxing Guitar",
    file: "idoberg-relaxing-guitar-loop-v5-245859.mp3",
  },
  {
    id: "gladiator",
    label: "Gladiator",
    file: "jean-paul-v-gladiateur-de-retour-du-combat-284537.mp3",
  },
  {
    id: "alarm-clock",
    label: "Alarm Clock",
    file: "lesiakower-maze-of-thoughts-alarm-clock-311402.mp3",
  },
  {
    id: "imperium",
    label: "Imperium",
    file: "rubyzephyr-imperium-aeternum-v1-430851.mp3",
  },
  {
    id: "none",
    label: "None",
    file: "",
  },
];

export function getHabitSoundById(id: string): HabitSound {
  return HABIT_SOUNDS.find((sound) => sound.id === id) ?? HABIT_SOUNDS[0];
}
