import { generateText } from "@/features/ai/aiClient";
import { getAiSettings } from "@/features/ai/aiSettingsStore";
import { buildGoalTaskPrompt, GoalTaskGenerationInput } from "@/features/goals/ai/buildGoalTaskPrompt";

const MAX_GENERATED_GOAL_TASKS = 8;

export class GoalTaskGenerationError extends Error {
  code: "ai-disabled" | "ai-incomplete" | "ai-empty" | "ai-request-failed";

  constructor(code: GoalTaskGenerationError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export async function generateGoalTasks(input: GoalTaskGenerationInput): Promise<string[]> {
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
    if (error instanceof GoalTaskGenerationError) {
      throw error;
    }

    throw new GoalTaskGenerationError(
      "ai-request-failed",
      error instanceof Error ? error.message : "Task generation failed.",
    );
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

      const normalizedKey = line.toLocaleLowerCase();

      if (seen.has(normalizedKey)) {
        return false;
      }

      seen.add(normalizedKey);
      return true;
    })
    .slice(0, MAX_GENERATED_GOAL_TASKS);
}

function normalizeGeneratedTaskLine(line: string): string {
  return line
    .replace(/^\s*[\-\*\u2022\u25cf\u25aa\u25e6]+\s*/u, "")
    .replace(/^\s*[\d\u06f0-\u06f9]+[).\-:]\s*/u, "")
    .replace(/^\s*[a-zA-Z][).\-\]]\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
}
