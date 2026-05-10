import { generateText } from "@/features/ai/aiClient";
import { getAiSettings } from "@/features/ai/aiSettingsStore";
import {
  buildGoalTaskPrompt,
  buildGoalTaskSuggestionPrompt,
  GoalTaskGenerationInput,
  GoalTaskSuggestionInput,
} from "@/features/goals/ai/buildGoalTaskPrompt";
import { TaskPriority } from "@/domains/tasks/types";

const MAX_GENERATED_GOAL_TASKS = 8;
const MAX_SUGGESTED_GOAL_TASKS = 7;

export interface GoalTaskSuggestion {
  priority: TaskPriority;
  reason?: string;
  title: string;
}

export class GoalTaskGenerationError extends Error {
  code: "ai-disabled" | "ai-incomplete" | "ai-empty" | "ai-request-failed";

  constructor(code: GoalTaskGenerationError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export async function generateGoalTasks(input: GoalTaskGenerationInput): Promise<string[]> {
  const settings = await getValidatedAiSettings();

  try {
    const result = await generateText(settings, buildGoalTaskPrompt(input));
    const tasks = parseGeneratedGoalTasks(result.text);

    if (tasks.length === 0) {
      throw new GoalTaskGenerationError(
        "ai-empty",
        "No usable tasks were generated from the AI response.",
      );
    }

    return tasks;
  } catch (error) {
    throw normalizeGoalTaskGenerationError(error);
  }
}

export async function generateGoalTaskSuggestions(
  input: GoalTaskSuggestionInput,
): Promise<GoalTaskSuggestion[]> {
  const settings = await getValidatedAiSettings();

  try {
    const result = await generateText(settings, buildGoalTaskSuggestionPrompt(input));
    const suggestions = parseGoalTaskSuggestions(result.text);
    const existingTitles = new Set(
      [
        ...input.existingTasks.map((task) => task.title),
        ...input.existingSubtasks.map((subtask) => subtask.title),
      ]
        .map(normalizeComparisonText)
        .filter(Boolean),
    );
    const filteredSuggestions = suggestions.filter(
      (suggestion) => !existingTitles.has(normalizeComparisonText(suggestion.title)),
    );

    if (filteredSuggestions.length === 0) {
      throw new GoalTaskGenerationError(
        "ai-empty",
        "No usable task suggestions were generated from the AI response.",
      );
    }

    return filteredSuggestions.slice(0, MAX_SUGGESTED_GOAL_TASKS);
  } catch (error) {
    throw normalizeGoalTaskGenerationError(error);
  }
}

export function parseGeneratedGoalTasks(rawText: string): string[] {
  const seen = new Set<string>();

  return rawText
    .split(/\r?\n+/)
    .map((line) => normalizeGeneratedTaskLine(line))
    .filter((line) => {
      if (!line) {
        return false;
      }

      const normalizedKey = normalizeComparisonText(line);

      if (seen.has(normalizedKey)) {
        return false;
      }

      seen.add(normalizedKey);
      return true;
    })
    .slice(0, MAX_GENERATED_GOAL_TASKS);
}

export function parseGoalTaskSuggestions(rawText: string): GoalTaskSuggestion[] {
  const parsedJsonSuggestions = parseJsonGoalTaskSuggestions(rawText);

  if (parsedJsonSuggestions.length > 0) {
    return dedupeGoalTaskSuggestions(parsedJsonSuggestions);
  }

  return dedupeGoalTaskSuggestions(
    parseGeneratedGoalTasks(rawText).map((title) => ({
      priority: "medium",
      title,
    })),
  );
}

async function getValidatedAiSettings() {
  const settings = await getAiSettings();

  if (!settings.enabled) {
    throw new GoalTaskGenerationError("ai-disabled", "AI Assistant is disabled.");
  }

  if (!settings.baseUrl.trim() || !settings.model.trim()) {
    throw new GoalTaskGenerationError(
      "ai-incomplete",
      "Complete your AI provider settings before generating tasks.",
    );
  }

  return settings;
}

function normalizeGoalTaskGenerationError(error: unknown): GoalTaskGenerationError {
  if (error instanceof GoalTaskGenerationError) {
    return error;
  }

  return new GoalTaskGenerationError(
    "ai-request-failed",
    error instanceof Error ? error.message : "Task generation failed.",
  );
}

function parseJsonGoalTaskSuggestions(rawText: string): GoalTaskSuggestion[] {
  const candidates = extractJsonCandidates(rawText);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      const normalized = normalizeSuggestionPayload(parsed);

      if (normalized.length > 0) {
        return normalized;
      }
    } catch {
      continue;
    }
  }

  return [];
}

function extractJsonCandidates(rawText: string): string[] {
  const candidates = [rawText.trim()];
  const fencedMatches = Array.from(rawText.matchAll(/```(?:json)?\s*([\s\S]*?)```/g));
  const objectMatch = rawText.match(/\{[\s\S]*\}/);

  fencedMatches.forEach((match) => {
    if (match[1]) {
      candidates.push(match[1].trim());
    }
  });

  if (objectMatch?.[0]) {
    candidates.push(objectMatch[0].trim());
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

function normalizeSuggestionPayload(payload: unknown): GoalTaskSuggestion[] {
  if (typeof payload !== "object" || payload === null || !("tasks" in payload) || !Array.isArray(payload.tasks)) {
    return [];
  }

  return payload.tasks
    .map((task) => normalizeSuggestionItem(task))
    .filter((task): task is GoalTaskSuggestion => Boolean(task))
    .slice(0, MAX_SUGGESTED_GOAL_TASKS);
}

function normalizeSuggestionItem(task: unknown): GoalTaskSuggestion | null {
  if (typeof task !== "object" || task === null || !("title" in task) || typeof task.title !== "string") {
    return null;
  }

  const title = normalizeGeneratedTaskLine(task.title);

  if (!title) {
    return null;
  }

  const reason =
    "reason" in task && typeof task.reason === "string" && task.reason.trim()
      ? task.reason.trim()
      : undefined;

  return {
    priority:
      "priority" in task && isTaskPriority(task.priority)
        ? task.priority
        : "medium",
    reason,
    title,
  };
}

function dedupeGoalTaskSuggestions(suggestions: GoalTaskSuggestion[]): GoalTaskSuggestion[] {
  const seen = new Set<string>();

  return suggestions.filter((suggestion) => {
    const normalized = normalizeComparisonText(suggestion.title);

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function normalizeGeneratedTaskLine(line: string): string {
  return line
    .replace(/^\s*[\-\*\u2022\u25cf\u25aa\u25e6]+\s*/u, "")
    .replace(/^\s*[\d\u06f0-\u06f9]+[).\-:]\s*/u, "")
    .replace(/^\s*[a-zA-Z][).\-\]]\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeComparisonText(value: string): string {
  return normalizeGeneratedTaskLine(value).toLocaleLowerCase();
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === "low" || value === "medium" || value === "high";
}
