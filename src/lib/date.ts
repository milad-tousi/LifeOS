export function formatDate(value: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(value);
}

export type GreetingPeriod = "morning" | "afternoon" | "evening";

export function getGreetingPeriod(date = new Date()): GreetingPeriod {
  const hour = date.getHours();

  if (hour >= 5 && hour <= 11) {
    return "morning";
  }

  if (hour >= 12 && hour <= 17) {
    return "afternoon";
  }

  return "evening";
}
