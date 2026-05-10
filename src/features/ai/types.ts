export type AiProvider = "openai" | "claude" | "gemini" | "ollama" | "custom";

export type AiConnectionTestStatus = "success" | "failed" | null;

export interface AiSettings {
  enabled: boolean;
  provider: AiProvider;
  baseUrl: string;
  apiKey?: string;
  model: string;
  lastTestStatus?: AiConnectionTestStatus;
  updatedAt: string;
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiGenerateTextResult {
  provider: AiProvider;
  raw: unknown;
  text: string;
}

export interface AiConnectionResult {
  error?: string;
  provider: AiProvider;
  status: Exclude<AiConnectionTestStatus, null>;
  text?: string;
}
