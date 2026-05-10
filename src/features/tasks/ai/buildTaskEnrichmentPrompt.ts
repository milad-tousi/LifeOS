import { GoalCategory, GoalStatus } from "@/domains/goals/types";
import { TaskPriority, TaskSource, TaskStatus, TaskSubtask } from "@/domains/tasks/types";
import { AiMessage } from "@/features/ai/types";
import { Language } from "@/i18n/i18n.types";

export interface TaskAiContext {
  appLanguage: Language;
  currentStatus: TaskStatus;
  description: string;
  dueDate: string;
  estimatedDurationMinutes: string;
  existingSources: TaskSource[];
  existingSubtasks: TaskSubtask[];
  goalCategory?: GoalCategory;
  goalDeadline?: string;
  goalDescription?: string;
  goalIsOverdue?: boolean;
  goalStatus?: GoalStatus;
  goalTitle?: string;
  priority: TaskPriority;
  tags: string[];
  todayDate: string;
  title: string;
  userLocale: string;
}

export function buildTaskBasicEnrichmentPrompt(context: TaskAiContext): AiMessage[] {
  return [
    {
      role: "system",
      content: [
        "You are an expert productivity assistant for LifeOS.",
        "Improve task clarity and planning quality.",
        "Return JSON only.",
        'Use this shape: {"title":"","description":"","tags":[],"priority":"low|medium|high","estimatedMinutes":0,"dueDate":"YYYY-MM-DD"}',
        "Keep suggestions practical and avoid medical, legal, investment, or professional financial advice.",
        "For finance-related tasks, stay at budgeting, organization, and planning level only.",
        "Today is the provided current date. Never suggest dates before today.",
        "If a goal deadline exists in the future, suggested task due dates must be on or before that goal deadline.",
        "If there is no deadline, use realistic dates within 1 to 30 days based on task size.",
        "Small tasks: 1 to 3 days. Medium tasks: 3 to 7 days. Large tasks: 1 to 4 weeks.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Respond in ${getPreferredLanguage(context.appLanguage)}.`,
        "Suggest better basic task details only if they genuinely improve clarity.",
        "Keep the task title concise and UI-friendly.",
        "Description should be useful and actionable.",
        "Tags should be short and relevant.",
        "Estimated duration must be realistic and positive.",
        "Due date is optional and should only be suggested if it helps planning.",
        `Today is ${context.todayDate}. Never suggest dates before today.`,
        formatTaskContext(context),
      ].join("\n\n"),
    },
  ];
}

export function buildTaskSubtasksPrompt(context: TaskAiContext): AiMessage[] {
  return [
    {
      role: "system",
      content: [
        "You are an expert productivity assistant for LifeOS.",
        "Break a task into actionable subtasks when appropriate.",
        "Return JSON only.",
        'Use this shape: {"subtasks":[{"title":"","description":"","priority":"low|medium|high","estimatedMinutes":0}]}',
        "Return 3 to 7 subtasks.",
        "Do not repeat existing subtasks.",
        "Keep titles short and concrete.",
        "Avoid medical, legal, investment, or professional financial advice.",
        "Today is the provided current date. Never suggest dates before today in any planning rationale.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Respond in ${getPreferredLanguage(context.appLanguage)}.`,
        "Only suggest subtasks if the task can be broken down usefully.",
        "Prefer concrete execution steps over vague planning advice.",
        `Today is ${context.todayDate}.`,
        formatTaskContext(context),
      ].join("\n\n"),
    },
  ];
}

export function buildTaskSourcesPrompt(context: TaskAiContext): AiMessage[] {
  return [
    {
      role: "system",
      content: [
        "You are an expert productivity assistant for LifeOS.",
        "Suggest helpful task sources and references without browsing the internet.",
        "Return JSON only.",
        'Use this shape: {"sources":[{"type":"note|link|video|file|image","mode":"url|search","title":"","url":"","query":"","content":"","description":""}]}',
        "Do not fabricate URLs.",
        "If you know a reliable official URL, you may return mode=url with a real URL.",
        "Otherwise return mode=search with a search query and do not fabricate a URL.",
        "Suggest practical notes, search topics, documentation names, or reference ideas only.",
        "Avoid medical, legal, investment, or professional financial advice.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Respond in ${getPreferredLanguage(context.appLanguage)}.`,
        "Suggest useful sources that would help complete this task.",
        "Prefer notes, search keywords, documentation names, and video search topics.",
        "Do not repeat existing sources.",
        `Today is ${context.todayDate}.`,
        formatTaskContext(context),
      ].join("\n\n"),
    },
  ];
}

function formatTaskContext(context: TaskAiContext): string {
  const tagsLine = context.tags.length > 0 ? context.tags.join(", ") : "none";
  const subtasksBlock =
    context.existingSubtasks.length > 0
      ? context.existingSubtasks
          .map((subtask) => `- ${subtask.title} [${subtask.completed ? "done" : "open"}]`)
          .join("\n")
      : "- none";
  const sourcesBlock =
    context.existingSources.length > 0
      ? context.existingSources
          .map((source) => `- ${source.type}: ${source.label || source.value || source.note || "untitled"}`)
          .join("\n")
      : "- none";

  return [
    `Task title: ${context.title}`,
    `Task description: ${context.description || "none"}`,
    `Task tags: ${tagsLine}`,
    `Current priority: ${context.priority}`,
    `Current status: ${context.currentStatus}`,
    `Due date: ${context.dueDate || "none"}`,
    `Today date: ${context.todayDate}`,
    `User locale: ${context.userLocale}`,
    `Estimated duration minutes: ${context.estimatedDurationMinutes || "none"}`,
    `Connected goal title: ${context.goalTitle || "none"}`,
    `Connected goal description: ${context.goalDescription || "none"}`,
    `Goal category: ${context.goalCategory || "none"}`,
    `Goal status: ${context.goalStatus || "none"}`,
    `Goal overdue: ${context.goalIsOverdue ? "yes" : "no"}`,
    `Goal deadline: ${context.goalDeadline || "none"}`,
    "Existing subtasks:",
    subtasksBlock,
    "Existing sources:",
    sourcesBlock,
  ].join("\n");
}

function getPreferredLanguage(language: Language): string {
  return language === "fa" ? "Persian (Farsi)" : "English";
}
