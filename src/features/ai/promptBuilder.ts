import { AiMessage } from "@/features/ai/types";

export function buildConnectionTestMessages(): AiMessage[] {
  return [
    {
      role: "system",
      content: "You are a connection test responder for LifeOS.",
    },
    {
      role: "user",
      content: "Reply with OK.",
    },
  ];
}
