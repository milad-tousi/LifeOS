export function compactWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

