import {
  CircleCheck,
  ClipboardList,
  FileText,
  Home,
  Settings,
  Target,
  Wallet,
} from "lucide-react";
import { ReactElement } from "react";
import { TranslationKey } from "@/i18n/i18n.types";

export type NavigationIconKey =
  | "dashboard"
  | "tasks"
  | "habits"
  | "goals"
  | "finance"
  | "reviews"
  | "settings";

export interface NavigationIconOptions {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export interface NavigationItem {
  href: string;
  label: string;
  labelKey: TranslationKey;
  icon: NavigationIconKey;
  showInMobileBottomNav: boolean;
}

export const navigationItems: NavigationItem[] = [
  { href: "/", label: "Dashboard", labelKey: "navigation.dashboard", icon: "dashboard", showInMobileBottomNav: false },
  { href: "/tasks", label: "Tasks", labelKey: "navigation.tasks", icon: "tasks", showInMobileBottomNav: true },
  { href: "/habits", label: "Habits", labelKey: "navigation.habits", icon: "habits", showInMobileBottomNav: true },
  { href: "/goals", label: "Goals", labelKey: "navigation.goals", icon: "goals", showInMobileBottomNav: true },
  { href: "/finance", label: "Finance", labelKey: "navigation.finance", icon: "finance", showInMobileBottomNav: true },
  { href: "/reviews", label: "Reviews", labelKey: "navigation.reviews", icon: "reviews", showInMobileBottomNav: true },
  { href: "/settings", label: "Settings", labelKey: "navigation.settings", icon: "settings", showInMobileBottomNav: false },
];

export function renderNavigationIcon(
  icon: NavigationIconKey,
  { className, size = 18, strokeWidth = 1.9 }: NavigationIconOptions = {},
): ReactElement {
  switch (icon) {
    case "dashboard":
      return <Home className={className} size={size} strokeWidth={strokeWidth} />;
    case "tasks":
      return <ClipboardList className={className} size={size} strokeWidth={strokeWidth} />;
    case "habits":
      return <CircleCheck className={className} size={size} strokeWidth={strokeWidth} />;
    case "goals":
      return <Target className={className} size={size} strokeWidth={strokeWidth} />;
    case "finance":
      return <Wallet className={className} size={size} strokeWidth={strokeWidth} />;
    case "reviews":
      return <FileText className={className} size={size} strokeWidth={strokeWidth} />;
    case "settings":
      return <Settings className={className} size={size} strokeWidth={strokeWidth} />;
  }
}
