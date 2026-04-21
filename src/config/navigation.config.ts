export interface NavigationItem {
  href: string;
  label: string;
}

export const navigationItems: NavigationItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/habits", label: "Habits" },
  { href: "/goals", label: "Goals" },
  { href: "/finance", label: "Finance" },
  { href: "/health", label: "Health" },
  { href: "/settings", label: "Settings" },
];
