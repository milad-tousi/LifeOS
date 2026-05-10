function extractString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          typeof part === "object" &&
          part !== null &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

export function parseOpenAiCompatibleText(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "choices" in payload &&
    Array.isArray(payload.choices) &&
    payload.choices.length > 0
  ) {
    const firstChoice = payload.choices[0];

    if (
      typeof firstChoice === "object" &&
      firstChoice !== null &&
      "message" in firstChoice &&
      typeof firstChoice.message === "object" &&
      firstChoice.message !== null &&
      "content" in firstChoice.message
    ) {
      return extractString(firstChoice.message.content);
    }
  }

  return "";
}

export function parseOllamaText(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "object" &&
    payload.message !== null &&
    "content" in payload.message
  ) {
    return extractString(payload.message.content);
  }

  return "";
}

export function parseApiErrorMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  if ("error" in payload) {
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error.trim();
    }

    if (
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string" &&
      payload.error.message.trim()
    ) {
      return payload.error.message.trim();
    }
  }

  if ("message" in payload && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  return null;
}
