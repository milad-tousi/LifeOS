import { createId } from "@/lib/id";

const HABIT_CATEGORIES_STORAGE_KEY = "lifeos:habitCategories:v1";

export interface HabitCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateHabitCategoryInput = Pick<HabitCategory, "name"> & {
  color?: string;
};

const defaultCategoryNames = [
  "Health",
  "Focus",
  "Learning",
  "Finance",
  "Home",
  "Wellness",
];

const defaultCategoryColors = ["#0ea5e9", "#2563eb", "#7c3aed", "#16a34a", "#f97316", "#10b981"];

function createDefaultCategories(): HabitCategory[] {
  const timestamp = new Date().toISOString();

  return defaultCategoryNames.map((name, index) => ({
    id: name,
    name,
    color: defaultCategoryColors[index] ?? "#2563eb",
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

function readCategories(): HabitCategory[] {
  if (typeof localStorage === "undefined") {
    return createDefaultCategories();
  }

  try {
    const rawValue = localStorage.getItem(HABIT_CATEGORIES_STORAGE_KEY);

    if (!rawValue) {
      const defaults = createDefaultCategories();
      saveHabitCategories(defaults);
      return defaults;
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    return Array.isArray(parsedValue) ? (parsedValue as HabitCategory[]) : createDefaultCategories();
  } catch {
    return createDefaultCategories();
  }
}

export function getHabitCategories(): HabitCategory[] {
  return readCategories();
}

export function saveHabitCategories(categories: HabitCategory[]): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(HABIT_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
}

export function createHabitCategory(input: CreateHabitCategoryInput): HabitCategory {
  const timestamp = new Date().toISOString();
  const category: HabitCategory = {
    id: createId(),
    name: input.name.trim(),
    color: input.color ?? "#2563eb",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveHabitCategories([...getHabitCategories(), category]);

  return category;
}

export function updateHabitCategory(
  id: string,
  patch: Partial<Pick<HabitCategory, "name" | "color">>,
): HabitCategory | null {
  let updatedCategory: HabitCategory | null = null;
  const nextCategories = getHabitCategories().map((category) => {
    if (category.id !== id) {
      return category;
    }

    updatedCategory = {
      ...category,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    return updatedCategory;
  });

  saveHabitCategories(nextCategories);

  return updatedCategory;
}

export function deleteHabitCategory(id: string): void {
  saveHabitCategories(getHabitCategories().filter((category) => category.id !== id));
}
