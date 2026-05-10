import { TaskPriority, TaskSourceType, TaskSubtask } from "@/domains/tasks/types";
import { generateText } from "@/features/ai/aiClient";
import { getAiSettings } from "@/features/ai/aiSettingsStore";
import {
  buildTaskBasicEnrichmentPrompt,
  buildTaskSourcesPrompt,
  buildTaskSubtasksPrompt,
  TaskAiContext,
} from "@/features/tasks/ai/buildTaskEnrichmentPrompt";
import { buildSearchLink } from "@/features/search/searchProvider";

export interface TaskBasicEnrichmentSuggestion {
  description?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  hadInvalidDueDate?: boolean;
  priority?: TaskPriority;
  tags: string[];
  title?: string;
}

export interface TaskSubtaskSuggestion {
  description?: string;
  estimatedMinutes?: number;
  priority?: TaskPriority;
  title: string;
}

export interface TaskSourceSuggestion {
  description?: string;
  mode: "search" | "url";
  query?: string;
  title: string;
  type: TaskSourceType;
  url?: string;
  content?: string;
}

export class TaskAiSuggestionError extends Error {
  code: "ai-disabled" | "ai-incomplete" | "ai-empty" | "ai-request-failed";

  constructor(code: TaskAiSuggestionError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export async function generateTaskBasicEnrichment(
  context: TaskAiContext,
): Promise<TaskBasicEnrichmentSuggestion> {
  const settings = await getValidatedAiSettings();

  try {
    const result = await generateText(settings, buildTaskBasicEnrichmentPrompt(context));
    const suggestion = parseTaskBasicEnrichment(result.text, context);

    if (
      !suggestion.title &&
      !suggestion.description &&
      suggestion.tags.length === 0 &&
      !suggestion.priority &&
      !suggestion.estimatedMinutes &&
      !suggestion.dueDate
    ) {
      throw new TaskAiSuggestionError("ai-empty", "No usable task enrichment was generated.");
    }

    return suggestion;
  } catch (error) {
    throw normalizeTaskAiSuggestionError(error);
  }
}

export async function generateTaskSubtaskSuggestions(
  context: TaskAiContext,
): Promise<TaskSubtaskSuggestion[]> {
  const settings = await getValidatedAiSettings();

  try {
    const result = await generateText(settings, buildTaskSubtasksPrompt(context));
    const suggestions = parseTaskSubtaskSuggestions(result.text);

    if (suggestions.length === 0) {
      throw new TaskAiSuggestionError("ai-empty", "No usable subtask suggestions were generated.");
    }

    return suggestions;
  } catch (error) {
    throw normalizeTaskAiSuggestionError(error);
  }
}

export async function generateTaskSourceSuggestions(
  context: TaskAiContext,
): Promise<TaskSourceSuggestion[]> {
  const settings = await getValidatedAiSettings();

  try {
    const result = await generateText(settings, buildTaskSourcesPrompt(context));
    const suggestions = parseTaskSourceSuggestions(result.text);

    if (suggestions.length === 0) {
      throw new TaskAiSuggestionError("ai-empty", "No usable source suggestions were generated.");
    }

    return suggestions;
  } catch (error) {
    throw normalizeTaskAiSuggestionError(error);
  }
}

function parseTaskBasicEnrichment(
  rawText: string,
  context: TaskAiContext,
): TaskBasicEnrichmentSuggestion {
  const payload = parseJsonPayload(rawText);

  if (!payload || typeof payload !== "object") {
    return {
      tags: [],
    };
  }

  const dueDate = normalizeSuggestedDueDate(
    typeof payload.dueDate === "string" ? payload.dueDate.trim() : undefined,
    context,
  );

  return {
    title: typeof payload.title === "string" && payload.title.trim() ? payload.title.trim() : undefined,
    description:
      typeof payload.description === "string" && payload.description.trim()
        ? payload.description.trim()
        : undefined,
    tags: Array.isArray(payload.tags)
      ? payload.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim()).map((tag) => tag.trim())
      : [],
    priority: isTaskPriority(payload.priority) ? payload.priority : undefined,
    estimatedMinutes:
      typeof payload.estimatedMinutes === "number" && Number.isFinite(payload.estimatedMinutes)
        ? Math.max(1, Math.round(payload.estimatedMinutes))
        : undefined,
    dueDate: dueDate.value,
    hadInvalidDueDate: dueDate.wasAdjusted,
  };
}

function parseTaskSubtaskSuggestions(rawText: string): TaskSubtaskSuggestion[] {
  const payload = parseJsonPayload(rawText);

  if (payload && typeof payload === "object" && Array.isArray(payload.subtasks)) {
    return dedupeByTitle(
      payload.subtasks
        .map((subtask) => normalizeTaskSubtaskSuggestion(subtask))
        .filter((subtask): subtask is TaskSubtaskSuggestion => Boolean(subtask)),
    );
  }

  return dedupeByTitle(
    parseLineFallback(rawText).map((title) => ({
      title,
    })),
  );
}

function parseTaskSourceSuggestions(rawText: string): TaskSourceSuggestion[] {
  const payload = parseJsonPayload(rawText);

  if (payload && typeof payload === "object" && Array.isArray(payload.sources)) {
    return dedupeBySourceKey(
      payload.sources
        .map((source) => normalizeTaskSourceSuggestion(source))
        .filter((source): source is TaskSourceSuggestion => Boolean(source)),
    );
  }

  return dedupeBySourceKey(
    parseLineFallback(rawText).map((title) => {
      const generatedSearchLink = buildSearchLink({
        query: title,
        type: "web",
      });

      return {
        mode: "search" as const,
        query: title,
        title,
        type: "link" as const,
        url: generatedSearchLink?.url,
      };
    }),
  );
}

function normalizeTaskSubtaskSuggestion(value: unknown): TaskSubtaskSuggestion | null {
  if (typeof value !== "object" || value === null || typeof value.title !== "string" || !value.title.trim()) {
    return null;
  }

  return {
    title: value.title.trim(),
    description: typeof value.description === "string" && value.description.trim() ? value.description.trim() : undefined,
    priority: isTaskPriority(value.priority) ? value.priority : undefined,
    estimatedMinutes:
      typeof value.estimatedMinutes === "number" && Number.isFinite(value.estimatedMinutes)
        ? Math.max(1, Math.round(value.estimatedMinutes))
        : undefined,
  };
}

function normalizeTaskSourceSuggestion(value: unknown): TaskSourceSuggestion | null {
  if (typeof value !== "object" || value === null || typeof value.title !== "string" || !value.title.trim()) {
    return null;
  }

  const type = isTaskSourceType(value.type) ? value.type : "note";
  const mode = value.mode === "url" || value.mode === "search" ? value.mode : "search";
  const url = typeof value.url === "string" ? value.url.trim() : "";
  const query = typeof value.query === "string" ? value.query.trim() : "";
  const content = typeof value.content === "string" && value.content.trim() ? value.content.trim() : undefined;
  const description =
    typeof value.description === "string" && value.description.trim()
      ? value.description.trim()
      : undefined;

  if (mode === "url" && !isHttpUrl(url)) {
    return null;
  }

  if (mode === "search" && !query && type !== "note") {
    return null;
  }

  const generatedSearchLink =
    mode === "search" && type !== "note"
      ? buildSearchLink({
          query: query || value.title.trim(),
          type: type === "video" ? "youtube" : "web",
        })
      : null;

  return {
    mode,
    type,
    title: value.title.trim(),
    content,
    query: mode === "search" ? query || value.title.trim() : undefined,
    url: mode === "url" ? url : generatedSearchLink?.url,
    description,
  };
}

async function getValidatedAiSettings() {
  const settings = await getAiSettings();

  if (!settings.enabled) {
    throw new TaskAiSuggestionError("ai-disabled", "AI Assistant is disabled.");
  }

  if (!settings.baseUrl.trim() || !settings.model.trim()) {
    throw new TaskAiSuggestionError("ai-incomplete", "Complete your AI provider settings first.");
  }

  return settings;
}

function normalizeTaskAiSuggestionError(error: unknown): TaskAiSuggestionError {
  if (error instanceof TaskAiSuggestionError) {
    return error;
  }

  return new TaskAiSuggestionError(
    "ai-request-failed",
    error instanceof Error ? error.message : "Task AI suggestion failed.",
  );
}

function parseJsonPayload(rawText: string): Record<string, unknown> | null {
  const candidates = extractJsonCandidates(rawText);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      continue;
    }
  }

  return null;
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

function parseLineFallback(rawText: string): string[] {
  const seen = new Set<string>();

  return rawText
    .split(/\r?\n+/)
    .map((line) =>
      line
        .replace(/^\s*[\-\*\u2022\u25cf\u25aa\u25e6]+\s*/u, "")
        .replace(/^\s*[\d\u06f0-\u06f9]+[).\-:]\s*/u, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => {
      if (!line) {
        return false;
      }

      const key = line.toLocaleLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function dedupeByTitle<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.title.trim().toLocaleLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function dedupeBySourceKey(items: TaskSourceSuggestion[]): TaskSourceSuggestion[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = [
      item.type,
      item.mode,
      item.title.trim().toLocaleLowerCase(),
      (item.url ?? "").trim().toLocaleLowerCase(),
      (item.query ?? "").trim().toLocaleLowerCase(),
      (item.content ?? "").trim().toLocaleLowerCase(),
    ].join("|");
    if (!item.title.trim() || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === "low" || value === "medium" || value === "high";
}

function isTaskSourceType(value: unknown): value is TaskSourceType {
  return value === "link" || value === "image" || value === "video" || value === "file" || value === "note";
}

function normalizeSuggestedDueDate(
  rawDueDate: string | undefined,
  context: TaskAiContext,
): { value?: string; wasAdjusted: boolean } {
  const today = context.todayDate;
  const goalDeadline = context.goalDeadline && context.goalDeadline >= today ? context.goalDeadline : undefined;

  if (!rawDueDate || !/^\d{4}-\d{2}-\d{2}$/.test(rawDueDate)) {
    return { wasAdjusted: false };
  }

  let nextValue = rawDueDate;
  let wasAdjusted = false;

  if (nextValue < today) {
    nextValue = today;
    wasAdjusted = true;
  }

  if (goalDeadline && nextValue > goalDeadline) {
    nextValue = goalDeadline;
    wasAdjusted = true;
  }

  return {
    value: nextValue,
    wasAdjusted,
  };
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
