export function formatDate(value: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(value);
}
