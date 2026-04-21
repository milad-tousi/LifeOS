export function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

export function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

