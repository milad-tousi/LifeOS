import { GoalCategory, GoalPace, GoalPriority } from "@/domains/goals/types";
import { GoalProgressSnapshot } from "@/domains/goals/goal-progress";
import { GoalProgressType } from "@/domains/goals/types";
import { TaskStatus } from "@/domains/tasks/types";
import { AiMessage } from "@/features/ai/types";
import { Language } from "@/i18n/i18n.types";

export interface GoalTaskGenerationInput {
  category: GoalCategory;
  deadline?: string;
  description: string;
  language: Language;
  pace: GoalPace;
  priority: GoalPriority;
  title: string;
}

export interface GoalTaskSuggestionInput extends GoalTaskGenerationInput {
  existingSubtasks: Array<{ completed: boolean; title: string }>;
  existingTasks: Array<{ overdue?: boolean; status: TaskStatus; title: string }>;
  notes?: string;
  progress: GoalProgressSnapshot;
  progressType: GoalProgressType;
}

const CATEGORY_CONTEXT: Record<GoalCategory, string> = {
  health: "health, fitness, wellbeing, or personal care",
  finance: "budgeting, saving, income, debt reduction, or money management",
  career: "career growth, work output, professional development, or job search",
  learning: "learning, study, language development, or skill building",
  lifestyle: "daily routines, home life, relationships, hobbies, or general life systems",
};

const PACE_CONTEXT: Record<GoalPace, string> = {
  gentle: "Keep the workload light, calm, and sustainable. Use a relaxed pace.",
  balanced: "Keep the workload moderate and consistent.",
  ambitious: "Use an intense but realistic pace with stronger momentum.",
};

const PRIORITY_CONTEXT: Record<GoalPriority, string> = {
  low: "Treat this as lower urgency and avoid overloading the plan.",
  medium: "Treat this as important but balanced with the rest of life.",
  high: "Treat this as high importance and prioritize meaningful progress.",
};

export function buildGoalTaskPrompt(input: GoalTaskGenerationInput): AiMessage[] {
  const preferredLanguage = input.language === "fa" ? "Persian (Farsi)" : "English";
  const deadlineLine = input.deadline ? `Deadline: ${input.deadline}` : "Deadline: none";
  const descriptionLine = input.description.trim()
    ? `Goal description: ${input.description.trim()}`
    : "Goal description: none";

  return [
    {
      role: "system",
      content:
        "You are an expert productivity coach for LifeOS. Generate practical, realistic starter tasks for a goal. Return only short task lines with no explanation before or after the list.",
    },
    {
      role: "user",
      content: [
        `Generate 5 to 8 actionable starter tasks in ${preferredLanguage}.`,
        "Each task must be specific, realistic, and directly useful.",
        "Avoid vague advice, motivation slogans, or duplicated ideas.",
        "Use plain editable task lines only.",
        "It is acceptable to use recurring-style tasks when they are the most realistic first steps.",
        `Goal title: ${input.title.trim()}`,
        descriptionLine,
        `Goal category context: ${CATEGORY_CONTEXT[input.category]}`,
        `Pace guidance: ${PACE_CONTEXT[input.pace]}`,
        `Priority guidance: ${PRIORITY_CONTEXT[input.priority]}`,
        deadlineLine,
        "If there is a deadline, sequence the tasks so the plan fits the available time.",
        "The tasks should feel like a strong first plan the user can edit immediately.",
      ].join("\n"),
    },
  ];
}

export function buildGoalTaskSuggestionPrompt(input: GoalTaskSuggestionInput): AiMessage[] {
  const preferredLanguage = input.language === "fa" ? "Persian (Farsi)" : "English";
  const deadlineLine = input.deadline ? `Deadline: ${input.deadline}` : "Deadline: none";
  const descriptionLine = input.description.trim()
    ? `Goal description: ${input.description.trim()}`
    : "Goal description: none";
  const notesLine = input.notes?.trim() ? `Goal notes: ${input.notes.trim()}` : "Goal notes: none";
  const existingTasksBlock =
    input.existingTasks.length > 0
      ? input.existingTasks
          .map((task) => `- ${task.title} [${task.overdue ? "overdue" : task.status}]`)
          .join("\n")
      : "- none";
  const existingSubtasksBlock =
    input.existingSubtasks.length > 0
      ? input.existingSubtasks
          .map((subtask) => `- ${subtask.title} [${subtask.completed ? "done" : "open"}]`)
          .join("\n")
      : "- none";
  const overdueCount = input.existingTasks.filter((task) => task.overdue).length;
  const openTaskCount = input.existingTasks.filter(
    (task) => task.status !== "done" && task.status !== "cancelled",
  ).length;

  return [
    {
      role: "system",
      content: [
        "You are an expert productivity coach for LifeOS.",
        "Suggest the next useful goal tasks based on existing progress.",
        "Prefer structured JSON with this shape:",
        '{"tasks":[{"title":"Short actionable task","reason":"Why this helps","priority":"low|medium|high"}]}',
        "Return 3 to 7 tasks.",
        "Do not repeat any existing task or subtask title.",
        "Keep task titles short, concrete, and editable in a task UI.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Respond in ${preferredLanguage}.`,
        `Goal title: ${input.title.trim()}`,
        descriptionLine,
        notesLine,
        `Goal category context: ${CATEGORY_CONTEXT[input.category]}`,
        `Pace guidance: ${PACE_CONTEXT[input.pace]}`,
        `Priority guidance: ${PRIORITY_CONTEXT[input.priority]}`,
        deadlineLine,
        `Progress mode: ${input.progressType}`,
        `Current progress: ${input.progress.completed}/${input.progress.total} tasks, ${input.progress.percentage}% complete.`,
        `Open or unfinished task count: ${openTaskCount}.`,
        `Overdue task count: ${overdueCount}.`,
        "Existing tasks:",
        existingTasksBlock,
        "Existing subtasks:",
        existingSubtasksBlock,
        "If the goal is overdue or behind, suggest recovery tasks.",
        "If many tasks are already completed, suggest next-level tasks.",
        "If no tasks exist, suggest starter tasks.",
        "Avoid duplicates and avoid vague advice.",
      ].join("\n"),
    },
  ];
}
