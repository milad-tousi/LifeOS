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

// ── Vision support ────────────────────────────────────────────────────────────

export interface AiVisionImageInput {
  /** base64-encoded image data (no data: prefix) */
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}

export interface AiVisionInput {
  systemPrompt: string;
  userPrompt: string;
  image: AiVisionImageInput;
}

export interface AiVisionResult {
  provider: AiProvider;
  raw: unknown;
  text: string;
}

/**
 * Returns true if the provider + model combination is expected to support
 * image/vision input. This is a heuristic; model support depends on the
 * exact model deployed by the provider.
 */
export function isVisionCapable(settings: AiSettings): boolean {
  const model = settings.model.toLowerCase();
  switch (settings.provider) {
    case "openai":
      // gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4-vision-preview, gpt-4.1, gpt-4.1-mini
      return (
        model.includes("gpt-4o") ||
        model.includes("gpt-4-turbo") ||
        model.includes("gpt-4-vision") ||
        model.startsWith("gpt-4.1") ||
        model.includes("o1") ||
        model.includes("vision")
      );
    case "gemini":
      // All Gemini models support vision
      return true;
    case "ollama":
      // Vision-capable local models
      return (
        model.includes("llava") ||
        model.includes("bakllava") ||
        model.includes("moondream") ||
        model.includes("minicpm") ||
        model.includes("cogvlm") ||
        model.includes("vision") ||
        model.includes("phi3-vision") ||
        model.includes("llama3.2-vision")
      );
    case "claude":
      // Claude 3+ supports vision via Anthropic API
      return (
        model.includes("claude-3") ||
        model.includes("claude-sonnet") ||
        model.includes("claude-opus") ||
        model.includes("claude-haiku")
      );
    case "custom":
      // Assume OpenAI-compatible vision; user is responsible for model choice
      return true;
    default:
      return false;
  }
}

