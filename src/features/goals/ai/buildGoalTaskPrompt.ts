import { GoalCategory, GoalPace, GoalPriority } from "@/domains/goals/types";
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
